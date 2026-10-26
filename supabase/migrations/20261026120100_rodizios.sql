-- Rodízio de organistas.
--
-- É a única parte do portal que guarda nome de irmã. Por isso as tabelas NÃO
-- têm leitura pública: só quem edita a área `rodizios` enxerga. As organistas
-- abrem a escala por um link com token aleatório, servido pela função
-- `rodizio_publico`, que devolve um rodízio só — nunca a lista de organistas
-- da regional. Ver docs/ARQUITETURA.md §5.6.

-- ---------------------------------------------------------------------------
-- Organistas de cada comum
-- ---------------------------------------------------------------------------

create table public.organistas (
  id                 uuid primary key default gen_random_uuid(),
  congregacao_id     uuid not null references public.congregacoes(id) on delete cascade,
  nome               text not null check (char_length(trim(nome)) > 0),
  -- Restrição padrão: dias da semana em que ela não pode tocar. É sugerida em
  -- todo rodízio novo da comum, e cada rodízio guarda a própria cópia.
  dows_indisponiveis smallint[] not null default '{}',
  ativo              boolean not null default true,
  criado_em          timestamptz not null default now(),
  unique (congregacao_id, nome),
  constraint dows_validos check (dows_indisponiveis <@ array[0,1,2,3,4,5,6]::smallint[])
);

create index organistas_comum_idx on public.organistas (congregacao_id);

comment on column public.organistas.dows_indisponiveis is
  'Dias da semana (0=domingo) em que não pode tocar. Padrão para os próximos rodízios.';

-- ---------------------------------------------------------------------------
-- Rodízios
-- ---------------------------------------------------------------------------

create table public.rodizios (
  id             uuid primary key default gen_random_uuid(),
  congregacao_id uuid not null references public.congregacoes(id) on delete cascade,
  inicio         date not null,
  fim            date not null,
  observacoes    text,
  -- Endereço público do rodízio (/rodizio/<token>). Aleatório para que não dê
  -- para adivinhar o de outra comum trocando um número na URL.
  token          uuid not null unique default gen_random_uuid(),
  criado_em      timestamptz not null default now(),
  atualizado_em  timestamptz not null default now(),
  constraint periodo_valido check (fim >= inicio and fim - inicio <= 366)
);

create index rodizios_comum_idx on public.rodizios (congregacao_id, inicio desc);

create trigger rodizios_touch
  before update on public.rodizios
  for each row execute function public.touch_atualizado_em();

-- Quem participa de cada rodízio, com as restrições usadas nele.
create table public.rodizio_organistas (
  rodizio_id          uuid not null references public.rodizios(id) on delete cascade,
  organista_id        uuid not null references public.organistas(id) on delete restrict,
  dows_indisponiveis  smallint[] not null default '{}',
  -- Datas específicas do período (viagem, compromisso). Não viram padrão.
  datas_indisponiveis date[] not null default '{}',
  primary key (rodizio_id, organista_id)
);

-- Uma linha por culto do período. Uma comum tem no máximo um culto por dia
-- (congregacao_cultos é por dia da semana), então a data identifica o culto.
create table public.rodizio_escala (
  rodizio_id   uuid not null references public.rodizios(id) on delete cascade,
  data         date not null,
  hora         time,
  organista_id uuid references public.organistas(id) on delete restrict,
  -- Definida à mão antes de gerar: o sorteio não mexe nela.
  fixo         boolean not null default false,
  primary key (rodizio_id, data)
);

-- ---------------------------------------------------------------------------
-- RLS: somente quem edita a área. Sem leitura pública.
-- ---------------------------------------------------------------------------

alter table public.organistas         enable row level security;
alter table public.rodizios           enable row level security;
alter table public.rodizio_organistas enable row level security;
alter table public.rodizio_escala     enable row level security;

create policy "edicao por area" on public.organistas
  for all to authenticated
  using (public.pode_editar('rodizios'))
  with check (public.pode_editar('rodizios'));

create policy "edicao por area" on public.rodizios
  for all to authenticated
  using (public.pode_editar('rodizios'))
  with check (public.pode_editar('rodizios'));

create policy "edicao por area" on public.rodizio_organistas
  for all to authenticated
  using (public.pode_editar('rodizios'))
  with check (public.pode_editar('rodizios'));

create policy "edicao por area" on public.rodizio_escala
  for all to authenticated
  using (public.pode_editar('rodizios'))
  with check (public.pode_editar('rodizios'));

-- ---------------------------------------------------------------------------
-- Gravação do rodízio inteiro numa transação
--
-- `security invoker`: roda com a permissão de quem chama, então a RLS acima
-- continua valendo. Ela existe só para que rodízio, participantes e escala
-- sejam gravados juntos — ou nada é gravado.
--
-- Formato de `dados`:
--   { id?, congregacao_id, inicio, fim, observacoes?,
--     organistas: [{ chave, id?, nome, dows_indisponiveis[], datas_indisponiveis[] }],
--     escala:     [{ data, hora?, organista? (chave), fixo }] }
--
-- `chave` é o id da organista, ou um identificador provisório para quem foi
-- cadastrada agora no próprio formulário.
-- ---------------------------------------------------------------------------

create or replace function public.salvar_rodizio(dados jsonb)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_id    uuid := nullif(dados ->> 'id', '')::uuid;
  v_comum uuid := (dados ->> 'congregacao_id')::uuid;
  v_org   uuid;
  o       jsonb;
  mapa    jsonb := '{}'::jsonb;
begin
  if v_id is null then
    insert into rodizios (congregacao_id, inicio, fim, observacoes)
    values (
      v_comum,
      (dados ->> 'inicio')::date,
      (dados ->> 'fim')::date,
      nullif(trim(dados ->> 'observacoes'), '')
    )
    returning id into v_id;
  else
    update rodizios
       set inicio = (dados ->> 'inicio')::date,
           fim = (dados ->> 'fim')::date,
           observacoes = nullif(trim(dados ->> 'observacoes'), '')
     where id = v_id and congregacao_id = v_comum;
    if not found then
      raise exception 'Rodízio não encontrado.';
    end if;

    delete from rodizio_escala where rodizio_id = v_id;
    delete from rodizio_organistas where rodizio_id = v_id;
  end if;

  for o in select * from jsonb_array_elements(coalesce(dados -> 'organistas', '[]'::jsonb)) loop
    v_org := nullif(o ->> 'id', '')::uuid;

    if v_org is null then
      insert into organistas (congregacao_id, nome, dows_indisponiveis)
      values (
        v_comum,
        trim(o ->> 'nome'),
        array(select jsonb_array_elements_text(o -> 'dows_indisponiveis'))::smallint[]
      )
      returning id into v_org;
    else
      -- A restrição usada agora vira o padrão dos próximos rodízios.
      update organistas
         set dows_indisponiveis =
               array(select jsonb_array_elements_text(o -> 'dows_indisponiveis'))::smallint[]
       where id = v_org and congregacao_id = v_comum;
      if not found then
        raise exception 'Organista não pertence a esta comum.';
      end if;
    end if;

    mapa := mapa || jsonb_build_object(o ->> 'chave', v_org);

    insert into rodizio_organistas (rodizio_id, organista_id, dows_indisponiveis, datas_indisponiveis)
    values (
      v_id,
      v_org,
      array(select jsonb_array_elements_text(o -> 'dows_indisponiveis'))::smallint[],
      array(select jsonb_array_elements_text(o -> 'datas_indisponiveis'))::date[]
    );
  end loop;

  insert into rodizio_escala (rodizio_id, data, hora, organista_id, fixo)
  select
    v_id,
    (e ->> 'data')::date,
    nullif(e ->> 'hora', '')::time,
    (mapa ->> (e ->> 'organista'))::uuid,
    coalesce((e ->> 'fixo')::boolean, false)
  from jsonb_array_elements(coalesce(dados -> 'escala', '[]'::jsonb)) e;

  return v_id;
end;
$$;

revoke execute on function public.salvar_rodizio(jsonb) from public, anon;
grant execute on function public.salvar_rodizio(jsonb) to authenticated;

-- ---------------------------------------------------------------------------
-- Leitura pública por token
--
-- `security definer` de propósito: anônimo não lê as tabelas acima. Esta
-- função é a única porta, e só abre o rodízio de quem tem o link. Devolve o
-- primeiro nome que a secretaria cadastrou e as datas — nada além.
-- ---------------------------------------------------------------------------

create or replace function public.rodizio_publico(p_token uuid)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'inicio', r.inicio,
    'fim', r.fim,
    'observacoes', r.observacoes,
    'congregacao', jsonb_build_object('id', c.id, 'nome', c.nome),
    'organistas', coalesce((
      select jsonb_agg(jsonb_build_object('id', o.id, 'nome', o.nome) order by o.nome)
      from rodizio_organistas ro
      join organistas o on o.id = ro.organista_id
      where ro.rodizio_id = r.id
    ), '[]'::jsonb),
    'escala', coalesce((
      select jsonb_agg(
        jsonb_build_object('data', e.data, 'hora', e.hora, 'organista_id', e.organista_id)
        order by e.data
      )
      from rodizio_escala e
      where e.rodizio_id = r.id
    ), '[]'::jsonb)
  )
  from rodizios r
  join congregacoes c on c.id = r.congregacao_id
  where r.token = p_token;
$$;

revoke execute on function public.rodizio_publico(uuid) from public;
grant execute on function public.rodizio_publico(uuid) to anon, authenticated;
