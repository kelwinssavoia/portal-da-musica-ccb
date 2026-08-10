-- Uma comum tem mais de um culto por semana, e varia de comum para comum.
--
-- O modelo antigo tinha um par único (`culto_dow`, `culto_hora`) na tabela de
-- congregações, o que só cabia um culto. Agora cada comum tem uma lista de
-- cultos, um por dia da semana, com a hora daquele dia.

create table public.congregacao_cultos (
  congregacao_id uuid not null references public.congregacoes(id) on delete cascade,
  dow            smallint not null check (dow between 0 and 6),
  hora           time,
  primary key (congregacao_id, dow)
);

comment on table public.congregacao_cultos is
  'Cultos oficiais de cada comum. Um registro por dia da semana. dow: 0=domingo.';

-- Leva o culto que já estava cadastrado para o formato novo, para nenhuma comum
-- ficar sem culto depois da migração.
insert into public.congregacao_cultos (congregacao_id, dow, hora)
select id, culto_dow, culto_hora
from public.congregacoes
where culto_dow is not null
on conflict do nothing;

alter table public.congregacoes drop column culto_dow;
alter table public.congregacoes drop column culto_hora;

-- Mesmas regras das outras tabelas de conteúdo: leitura pública, escrita por área.
alter table public.congregacao_cultos enable row level security;

create policy "leitura publica" on public.congregacao_cultos
  for select to anon, authenticated using (true);

create policy "edicao por area" on public.congregacao_cultos
  for all to authenticated
  using (public.pode_editar('congregacoes'))
  with check (public.pode_editar('congregacoes'));
