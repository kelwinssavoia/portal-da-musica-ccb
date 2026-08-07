-- Portal da Música — dados de partida
--
-- GENÉRICO DE PROPÓSITO: nada de uma região específica entra aqui. As
-- congregações, circulares e arquivos da sua regional você cadastra pelo CMS.
-- Ver CONTRIBUTING.md.

-- ---------------------------------------------------------------------------
-- Tipos de evento (cores da identidade CCB)
-- ---------------------------------------------------------------------------

insert into public.tipos_evento (id, label, cor, cor_suave, ordem) values
  ('local',            'Ensaio local',          '#033d60', '#e6eef3', 1),
  ('regional',         'Ensaio regional',       '#0a6ea3', '#e3f0f8', 2),
  ('secretaria',       'Reunião de secretaria', '#645f77', '#eeedf1', 3),
  ('teste_musicos',    'Teste de músicos',      '#ee1d23', '#fde5e6', 4),
  ('teste_organistas', 'Teste de organistas',   '#2aba66', '#e2f6eb', 5)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Ajustes — troque pelos textos da sua região
-- ---------------------------------------------------------------------------

insert into public.ajustes (chave, valor, descricao) values
  ('instituicao', 'Congregação Cristã no Brasil · Música',
   'Faixa institucional do topo.'),
  ('regiao', 'Sua Região',
   'Nome da região. Aparece na faixa do topo e no rodapé.'),
  ('titulo', 'Portal da Música',
   'Título grande do cabeçalho.'),
  ('subtitulo', 'Sua Região · Secretaria da Música',
   'Linha abaixo do título.'),
  ('localidade', 'Sua Região — Cidade/UF',
   'Primeira linha do rodapé.'),
  ('contato', '',
   'Contato no rodapé. Vazio = não aparece. Nunca use dado pessoal de irmão.'),
  ('hero_texto',
   'Um lugar só para as informações da música da regional: congregações, ensaios, calendário, circulares e os arquivos da secretaria.',
   'Texto de apresentação da tela de Início.'),
  ('rodape_nota',
   'Projeto open-source, mantido por voluntário. Não é um canal oficial da Congregação Cristã no Brasil.',
   'Nota final do rodapé.'),
  ('indexavel', 'sim',
   'O portal pode aparecer no Google? "sim" ou "nao". Ver docs/ARQUITETURA.md §8.1.')
on conflict (chave) do nothing;

-- ---------------------------------------------------------------------------
-- Categorias de arquivo da Secretaria
-- ---------------------------------------------------------------------------

insert into public.arquivo_categorias (nome, descricao, ordem) values
  ('Fichas Músicos',
   'Fichas de controle que precisam ser preenchidas e enviadas.', 1),
  ('Fichas Organistas',
   'Fichas de controle que precisam ser preenchidas e enviadas.', 2),
  ('Calendários',
   'Datas de ensaios, reuniões e cultos oficiais.', 3)
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- Dúvidas frequentes
--
-- ATENÇÃO: são textos de partida, não orientação oficial da CCB. Ajuste cada
-- resposta com o que vale na sua região antes de divulgar o portal.
-- ---------------------------------------------------------------------------

insert into public.duvidas (pergunta, resposta, ordem) values
  ('Qual é o prazo para entregar as fichas do mês?',
   'Confirme o prazo com o encarregado local e ajuste esta resposta no CMS.',
   1),
  ('Como faço para cadastrar um músico ou organista novo?',
   'Baixe a ficha correspondente na área Secretaria, preencha com os dados, colha a assinatura do encarregado local e envie pelo canal combinado com a regional.',
   2),
  ('Perdi o prazo de envio. O que fazer?',
   'Envie assim que possível e comunique o encarregado, explicando o motivo do atraso. Não deixe de enviar — o histórico precisa ficar completo.',
   3),
  ('Preciso imprimir as fichas ou posso preencher no computador?',
   'Ajuste conforme a orientação da sua regional. Em geral as planilhas podem ser preenchidas digitalmente; fichas que exigem assinatura precisam ser impressas.',
   4),
  ('Como incluo um arquivo novo neste portal?',
   'Quem tem acesso ao CMS sobe o arquivo em /admin. Se você não tem acesso, envie o arquivo e o título ao responsável pelo portal.',
   5)
on conflict do nothing;
