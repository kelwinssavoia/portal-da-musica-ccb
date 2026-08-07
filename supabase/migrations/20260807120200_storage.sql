-- Portal da Música — buckets de arquivos
--
-- O portal hospeda o próprio conteúdo: subir uma ficha nova é escolher o PDF no
-- CMS, sem passar pelo Drive. Ver docs/ARQUITETURA.md §4.4.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'congregacoes', 'congregacoes', true, 5242880,
    array['image/jpeg', 'image/png', 'image/webp']
  ),
  (
    'arquivos', 'arquivos', true, 26214400,
    array[
      'application/pdf',
      'image/jpeg',
      'image/png',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]
  ),
  (
    'circulares', 'circulares', true, 26214400,
    array['application/pdf']
  )
on conflict (id) do nothing;

-- Leitura aberta: o conteúdo é o mesmo que o portal já mostra na tela.
create policy "leitura publica dos arquivos do portal"
  on storage.objects for select to anon, authenticated
  using (bucket_id in ('congregacoes', 'arquivos', 'circulares'));

-- Escrita: mesma permissão por área que vale para as tabelas.
create policy "edita fotos de congregacao"
  on storage.objects for all to authenticated
  using      (bucket_id = 'congregacoes' and public.pode_editar('congregacoes'))
  with check (bucket_id = 'congregacoes' and public.pode_editar('congregacoes'));

create policy "edita arquivos da secretaria"
  on storage.objects for all to authenticated
  using      (bucket_id = 'arquivos' and public.pode_editar('arquivos'))
  with check (bucket_id = 'arquivos' and public.pode_editar('arquivos'));

create policy "edita pdfs de circular"
  on storage.objects for all to authenticated
  using      (bucket_id = 'circulares' and public.pode_editar('circulares'))
  with check (bucket_id = 'circulares' and public.pode_editar('circulares'));
