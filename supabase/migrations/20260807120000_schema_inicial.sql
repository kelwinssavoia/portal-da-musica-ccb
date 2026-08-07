-- Portal da Música — schema inicial
-- Ver docs/ARQUITETURA.md §4 para o desenho e o porquê de cada tabela.

create extension if not exists unaccent with schema extensions;

-- ---------------------------------------------------------------------------
-- Tipos
-- ---------------------------------------------------------------------------

create type public.app_role as enum ('admin', 'editor');

create type public.portal_area as enum (
  'congregacoes', 'eventos', 'circulares',
  'arquivos', 'duvidas', 'ajustes', 'usuarios'
);

create type public.tipo_arquivo as enum (
  'pdf', 'planilha', 'documento', 'formulario', 'pasta', 'video', 'link'
);

-- ---------------------------------------------------------------------------
-- Utilitários
-- ---------------------------------------------------------------------------

create or replace function public.touch_atualizado_em()
returns trigger
language plpgsql
as $$
begin
  new.atualizado_em = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Identidade: perfis e permissões por área
-- ---------------------------------------------------------------------------

create table public.perfis (
  id        uuid primary key references auth.users(id) on delete cascade,
  nome      text not null default '',
  email     text not null,
  papel     public.app_role not null default 'editor',
  ativo     boolean not null default false,
  criado_em timestamptz not null default now()
);

comment on table public.perfis is
  'Espelha auth.users. Criado inativo pelo trigger; um admin libera o acesso.';

-- Áreas que um editor pode alterar. Ignorado quando papel = 'admin'.
create table public.perfil_areas (
  perfil_id uuid not null references public.perfis(id) on delete cascade,
  area      public.portal_area not null,
  primary key (perfil_id, area)
);

-- Todo usuário autenticado ganha um perfil — inativo, sem permissão nenhuma.
-- Quem não foi convidado por um admin não edita nada, mesmo autenticando.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.perfis (id, nome, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'nome', ''),
    coalesce(new.email, '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Ninguém promove a si mesmo: papel e situação de acesso só mudam por admin.
create or replace function public.protege_papel()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    if new.papel is distinct from old.papel or new.ativo is distinct from old.ativo then
      raise exception 'Somente administradores alteram papel ou situação de acesso.';
    end if;
  end if;
  return new;
end;
$$;

create trigger perfis_protege_papel
  before update on public.perfis
  for each row execute function public.protege_papel();

-- ---------------------------------------------------------------------------
-- Congregações (comuns)
-- ---------------------------------------------------------------------------

create table public.congregacoes (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique,
  nome          text not null,
  endereco      text not null default '',
  maps_url      text,
  foto_path     text,
  culto_dow     smallint check (culto_dow between 0 and 6),
  culto_hora    time,
  ensaio_ord    smallint check (ensaio_ord between 1 and 5),
  ensaio_dow    smallint check (ensaio_dow between 0 and 6),
  ensaio_hora   time,
  ensaio_meses  smallint[],
  observacoes   text,
  ordem         int not null default 0,
  ativo         boolean not null default true,
  atualizado_em timestamptz not null default now(),
  constraint ensaio_meses_validos check (
    ensaio_meses is null or (
      array_length(ensaio_meses, 1) between 1 and 12
      and ensaio_meses <@ array[1,2,3,4,5,6,7,8,9,10,11,12]::smallint[]
    )
  )
);

comment on column public.congregacoes.ensaio_ord is
  '1..4 = n-ésima ocorrência no mês; 5 = último dia da semana do mês.';
comment on column public.congregacoes.ensaio_dow is '0 = domingo … 6 = sábado.';
comment on column public.congregacoes.ensaio_meses is
  'null = todo mês. Lista 1..12 para ensaio que não é mensal (ex.: {3,6,9,12}).';

create trigger congregacoes_touch
  before update on public.congregacoes
  for each row execute function public.touch_atualizado_em();

-- ---------------------------------------------------------------------------
-- Eventos
-- ---------------------------------------------------------------------------

create table public.tipos_evento (
  id        text primary key,
  label     text not null,
  cor       text not null,
  cor_suave text not null,
  ordem     int  not null default 0
);

-- Ensaio local NÃO entra aqui: é gerado do padrão da congregação.
create table public.eventos (
  id             uuid primary key default gen_random_uuid(),
  tipo_id        text not null references public.tipos_evento(id),
  titulo         text not null,
  data           date not null,
  hora           time,
  congregacao_id uuid references public.congregacoes(id) on delete set null,
  descricao      text,
  ativo          boolean not null default true
);

create index eventos_data_idx on public.eventos (data);

-- Cancelamento ou remanejamento de uma data específica de ensaio local.
create table public.ensaio_excecoes (
  id             uuid primary key default gen_random_uuid(),
  congregacao_id uuid not null references public.congregacoes(id) on delete cascade,
  data_original  date not null,
  cancelado      boolean not null default false,
  nova_data      date,
  nova_hora      time,
  motivo         text,
  unique (congregacao_id, data_original)
);

create index ensaio_excecoes_data_idx on public.ensaio_excecoes (data_original);

-- ---------------------------------------------------------------------------
-- Circulares
-- ---------------------------------------------------------------------------

create table public.circulares (
  id           uuid primary key default gen_random_uuid(),
  numero       text not null,
  titulo       text not null,
  resumo       text,
  data         date not null,
  origem       text not null default 'upload' check (origem in ('upload', 'link')),
  arquivo_path text,
  arquivo_nome text,
  url          text,
  publicado    boolean not null default true,
  constraint circular_tem_origem check (
    (origem = 'upload' and arquivo_path is not null) or
    (origem = 'link'   and url is not null)
  )
);

create index circulares_data_idx on public.circulares (data desc);

-- ---------------------------------------------------------------------------
-- Secretaria: arquivos e dúvidas
-- ---------------------------------------------------------------------------

create table public.arquivo_categorias (
  id        uuid primary key default gen_random_uuid(),
  nome      text not null,
  descricao text,
  ordem     int not null default 0,
  ativo     boolean not null default true
);

create table public.arquivos (
  id            uuid primary key default gen_random_uuid(),
  categoria_id  uuid not null references public.arquivo_categorias(id) on delete cascade,
  titulo        text not null,
  descricao     text,
  tipo          public.tipo_arquivo not null default 'pdf',
  origem        text not null default 'upload' check (origem in ('upload', 'link')),
  arquivo_path  text,
  arquivo_nome  text,
  tamanho_bytes bigint,
  url           text,
  versao        int not null default 1,
  prazo         text,
  exemplo       boolean not null default false,
  ordem         int not null default 0,
  ativo         boolean not null default true,
  atualizado_em timestamptz not null default now(),
  constraint arquivo_tem_origem check (
    (origem = 'upload' and arquivo_path is not null) or
    (origem = 'link'   and url is not null)
  )
);

comment on column public.arquivos.versao is
  'Incrementa a cada substituição. Serve de cache-buster (?v=) para que o '
  'endereço do arquivo não mude quando sai uma versão nova.';
comment on column public.arquivos.exemplo is
  'Conteúdo placeholder, ainda não conferido pela secretaria.';

create trigger arquivos_touch
  before update on public.arquivos
  for each row execute function public.touch_atualizado_em();

create table public.duvidas (
  id       uuid primary key default gen_random_uuid(),
  pergunta text not null,
  resposta text not null,
  ordem    int not null default 0,
  ativo    boolean not null default true
);

-- ---------------------------------------------------------------------------
-- Ajustes do portal
-- ---------------------------------------------------------------------------

create table public.ajustes (
  chave     text primary key,
  valor     text not null default '',
  descricao text
);
