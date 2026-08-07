-- Portal da Música — Row Level Security
--
-- Princípio: a segurança mora aqui, não na interface. Esconder um botão no CMS
-- é conveniência; a política do Postgres é a garantia.
--
-- Leitura pública em tudo que está ativo/publicado. Escrita só para quem tem a
-- área correspondente. Ver docs/ARQUITETURA.md §4.3.

-- ---------------------------------------------------------------------------
-- Funções de permissão
--
-- `security definer` de propósito: precisam ler `perfis` ignorando a RLS da
-- própria tabela, senão a política que as usa entraria em recursão.
-- ---------------------------------------------------------------------------

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.perfis p
    where p.id = auth.uid() and p.ativo and p.papel = 'admin'
  );
$$;

create or replace function public.pode_editar(a public.portal_area)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_admin() or exists (
    select 1
    from public.perfis p
    join public.perfil_areas pa on pa.perfil_id = p.id
    where p.id = auth.uid() and p.ativo and pa.area = a
  );
$$;

-- ---------------------------------------------------------------------------
-- Perfis e permissões — só admin administra
-- ---------------------------------------------------------------------------

alter table public.perfis       enable row level security;
alter table public.perfil_areas enable row level security;

create policy "le o proprio perfil" on public.perfis
  for select to authenticated
  using (id = auth.uid() or public.is_admin());

-- Nome e e-mail o próprio usuário ajusta; papel e situação são barrados pelo
-- trigger `perfis_protege_papel`.
create policy "atualiza o proprio perfil" on public.perfis
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "admin administra perfis" on public.perfis
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "le as proprias areas" on public.perfil_areas
  for select to authenticated
  using (perfil_id = auth.uid() or public.is_admin());

create policy "admin administra areas" on public.perfil_areas
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Conteúdo
-- ---------------------------------------------------------------------------

alter table public.congregacoes       enable row level security;
alter table public.tipos_evento       enable row level security;
alter table public.eventos            enable row level security;
alter table public.ensaio_excecoes    enable row level security;
alter table public.circulares         enable row level security;
alter table public.arquivo_categorias enable row level security;
alter table public.arquivos           enable row level security;
alter table public.duvidas            enable row level security;
alter table public.ajustes            enable row level security;

-- Congregações
create policy "leitura publica" on public.congregacoes
  for select to anon, authenticated using (ativo);
create policy "edicao por area" on public.congregacoes
  for all to authenticated
  using (public.pode_editar('congregacoes'))
  with check (public.pode_editar('congregacoes'));

-- Tipos de evento: legenda do calendário, sempre visível.
create policy "leitura publica" on public.tipos_evento
  for select to anon, authenticated using (true);
create policy "edicao por area" on public.tipos_evento
  for all to authenticated
  using (public.pode_editar('eventos'))
  with check (public.pode_editar('eventos'));

-- Eventos
create policy "leitura publica" on public.eventos
  for select to anon, authenticated using (ativo);
create policy "edicao por area" on public.eventos
  for all to authenticated
  using (public.pode_editar('eventos'))
  with check (public.pode_editar('eventos'));

-- Exceções de ensaio: leitura aberta porque o calendário público depende delas
-- para não mostrar um ensaio cancelado.
create policy "leitura publica" on public.ensaio_excecoes
  for select to anon, authenticated using (true);
create policy "edicao por area" on public.ensaio_excecoes
  for all to authenticated
  using (public.pode_editar('eventos'))
  with check (public.pode_editar('eventos'));

-- Circulares
create policy "leitura publica" on public.circulares
  for select to anon, authenticated using (publicado);
create policy "edicao por area" on public.circulares
  for all to authenticated
  using (public.pode_editar('circulares'))
  with check (public.pode_editar('circulares'));

-- Categorias de arquivo
create policy "leitura publica" on public.arquivo_categorias
  for select to anon, authenticated using (ativo);
create policy "edicao por area" on public.arquivo_categorias
  for all to authenticated
  using (public.pode_editar('arquivos'))
  with check (public.pode_editar('arquivos'));

-- Arquivos
create policy "leitura publica" on public.arquivos
  for select to anon, authenticated using (ativo);
create policy "edicao por area" on public.arquivos
  for all to authenticated
  using (public.pode_editar('arquivos'))
  with check (public.pode_editar('arquivos'));

-- Dúvidas
create policy "leitura publica" on public.duvidas
  for select to anon, authenticated using (ativo);
create policy "edicao por area" on public.duvidas
  for all to authenticated
  using (public.pode_editar('duvidas'))
  with check (public.pode_editar('duvidas'));

-- Ajustes: são os textos do portal, todos públicos por natureza.
create policy "leitura publica" on public.ajustes
  for select to anon, authenticated using (true);
create policy "edicao por area" on public.ajustes
  for all to authenticated
  using (public.pode_editar('ajustes'))
  with check (public.pode_editar('ajustes'));
