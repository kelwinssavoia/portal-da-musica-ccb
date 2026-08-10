-- Cidades da região.
--
-- Uma regional cobre mais de uma cidade (a Bragantina tem quatro), e saber em
-- qual cidade fica cada comum é o que permite agrupar a lista de congregações de
-- um jeito legível — em vez de uma grade única com todas misturadas.

create table public.cidades (
  id    uuid primary key default gen_random_uuid(),
  nome  text not null,
  /** Sigla do estado. Uma regional pode atravessar divisa. */
  uf    text check (uf is null or char_length(uf) = 2),
  ativo boolean not null default true,
  unique (nome, uf)
);

comment on table public.cidades is
  'Cidades atendidas pela regional. Toda congregação pertence a uma.';

-- Nulo por enquanto: as comuns já cadastradas ainda não têm cidade, e forçar
-- agora deixaria a tabela num estado inválido. O formulário do CMS exige a
-- escolha assim que existir ao menos uma cidade cadastrada.
alter table public.congregacoes
  add column cidade_id uuid references public.cidades(id) on delete set null;

create index congregacoes_cidade_idx on public.congregacoes (cidade_id);

alter table public.cidades enable row level security;

create policy "leitura publica" on public.cidades
  for select to anon, authenticated using (ativo);

-- Mesma permissão de congregações: quem cadastra comum cadastra a cidade dela.
create policy "edicao por area" on public.cidades
  for all to authenticated
  using (public.pode_editar('congregacoes'))
  with check (public.pode_editar('congregacoes'));
