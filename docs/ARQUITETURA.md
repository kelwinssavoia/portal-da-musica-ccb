# Portal da Música — Arquitetura e especificação

> Documento de referência do projeto. No repositório público ele vive em
> `docs/ARQUITETURA.md` e é a fonte de verdade para quem quiser **implantar o
> portal na própria região** ou contribuir com o código.

Portal open-source da Secretaria da Música da Congregação Cristã no Brasil.
Nasceu na **Região Bragantina** e é distribuído sob licença **MIT** para que
qualquer regional possa rodar a própria instância.

---

## 1. Decisões fundamentais

| Decisão | Escolha | Motivo |
| --- | --- | --- |
| Distribuição | **Uma instância por região** | Cada regional faz fork, cria o próprio projeto Supabase e o próprio deploy. Dados isolados, sem custo compartilhado, sem `region_id` espalhado pelo código. |
| Stack | **Next.js (App Router) + Supabase** | Renderização no servidor para o portal público, e um CMS autenticado no mesmo app. Supabase entrega banco, auth e storage sem servidor próprio. |
| CMS | **Embutido no mesmo projeto**, em `/admin` | Quem mantém o portal não precisa de outra ferramenta nem de planilha. |
| Permissões | **Papéis por área** (`admin` + `editor` com áreas) | Uma secretaria tem vários irmãos; nem todos precisam mexer em tudo. |
| Hospedagem | **Vercel** (free tier) + **Supabase** (free tier) | Custo zero na escala de uma regional. |
| Licença | **MIT** | Uso, cópia e adaptação livres, inclusive por outras regiões e por outros departamentos. |

### O que este projeto substitui

O portal atual (`portal-musica`) é um site estático que lê uma planilha do
Google e mostra **arquivos por categoria + dúvidas frequentes**. Ele continua
funcionando e vira **uma das áreas** do novo portal (a área *Secretaria*). O
conteúdo da planilha é migrado para o banco na instalação (ver §9.4).

---

## 2. Escopo do produto

Seis áreas públicas, especificadas visualmente em `portal-frontend/` (protótipo
`Portal.dc.html` + `DOCUMENTACAO.md`):

1. **Início** — hero, atalhos com contagem, próximos eventos, últimas circulares.
2. **Congregações** — cards com foto, endereço, culto oficial e ensaio local;
   detalhe com rota no GPS.
3. **Ensaios** — três visões: por comum, por dia da semana, próximos do mês.
   Ensaios regionais listados abaixo.
4. **Calendário** — grade mensal ↔ agenda, com tipos de evento coloridos.
5. **Circulares** — comunicados oficiais, com destaque para o mais recente.
6. **Secretaria** — fichas, calendários e dúvidas frequentes (o portal antigo).
   Os arquivos passam a ser **hospedados pelo próprio portal** (§4.4), e não
   mais links para o Drive/OneDrive.

Mais **busca global** e **link direto para cada congregação**.

### Princípio de conteúdo

> **Nada de dado pessoal no portal.** Nem nomes de irmãos, nem telefones, nem
> e-mails, nem listas de músicos. O portal guarda endereços de comuns, datas,
> links de arquivos e textos institucionais. Isso é regra de projeto, não
> sugestão — o portal é público na internet.

---

## 3. Stack e dependências

| Camada | Escolha |
| --- | --- |
| Framework | Next.js (App Router, TypeScript, Server Components) |
| Estilo | CSS global com as variáveis da identidade CCB + Tailwind para layout |
| CMS UI | formulários HTML nativos + Server Actions (sem biblioteca de componentes) |
| Banco / Auth / Storage | Supabase (Postgres + Auth + Storage) |
| Cliente Supabase | `@supabase/supabase-js` + `@supabase/ssr` |
| Validação | Zod (schemas compartilhados entre formulário e Server Action) |
| Datas | funções puras próprias (`lib/ensaios.ts`) — sem biblioteca de data |
| Testes | Vitest para as regras de recorrência e de busca |
| Deploy | Vercel (produção = branch `main`) |

### Identidade visual (tokens, de `estilo.css`)

```css
--azul: #033d60;        /* títulos, links, menu, borda dos cards */
--azul-escuro: #0c1e3f; /* faixa institucional / hero */
--azul-link: #0056b3;   /* hover de link */
--cinza: #d4d9e2;       /* cabeçalho, rodapé, bordas 2px */
--texto: #645f77;       /* texto secundário */
--fundo: #f4f5f8;       /* fundo da página */
--superficie: #ffffff;
--vermelho: #ee1d23;    /* prazos, "hoje", alertas */
--verde: #2aba66;       /* teste de organistas */
```

Tipografia **Verdana**, títulos em negrito, menu com separadores verticais de
2px e marcador ativo sublinhado, cards com borda azul de 4px à esquerda, rodapé
com borda superior azul de 6px. Ícones **monocromáticos de linha em SVG** —
nunca emoji.

---

## 4. Modelo de dados

Todas as tabelas em `public`, com RLS **habilitada**. Migrações versionadas em
`supabase/migrations/`, aplicadas com a CLI do Supabase.

### 4.1 Tipos e tabelas de identidade

```sql
create type app_role    as enum ('admin', 'editor');
create type portal_area as enum ('congregacoes','eventos','circulares',
                                 'arquivos','duvidas','ajustes','usuarios');

-- Espelha auth.users. Criado por trigger no primeiro login.
create table public.perfis (
  id         uuid primary key references auth.users(id) on delete cascade,
  nome       text not null default '',
  email      text not null,
  papel      app_role not null default 'editor',
  ativo      boolean not null default true,
  criado_em  timestamptz not null default now()
);

-- Áreas que um editor pode alterar. Ignorado para papel = 'admin'.
create table public.perfil_areas (
  perfil_id uuid not null references public.perfis(id) on delete cascade,
  area      portal_area not null,
  primary key (perfil_id, area)
);
```

### 4.2 Conteúdo

```sql
-- ---------- Congregações (comuns) ----------
create table public.congregacoes (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique,           -- usado na URL: /congregacoes/centro
  nome         text not null,
  endereco     text not null default '',
  maps_url     text,                           -- vazio => gerado a partir do endereço
  foto_path    text,                           -- caminho no bucket 'congregacoes'
  culto_dow    smallint check (culto_dow between 0 and 6),   -- 0=Dom
  culto_hora   time,
  ensaio_ord   smallint check (ensaio_ord between 1 and 5),  -- 5 = "último"
  ensaio_dow   smallint check (ensaio_dow between 0 and 6),
  ensaio_hora  time,
  ensaio_meses smallint[],                     -- null = todo mês; ex.: {3,6,9,12}
  observacoes  text,
  ordem        int not null default 0,
  ativo        boolean not null default true,
  atualizado_em timestamptz not null default now()
);

-- ---------- Tipos de evento (semente editável) ----------
create table public.tipos_evento (
  id        text primary key,      -- 'local','regional','secretaria',...
  label     text not null,
  cor       text not null,
  cor_suave text not null,
  ordem     int  not null default 0
);

-- ---------- Eventos avulsos ----------
-- Ensaio local NÃO entra aqui: é gerado do padrão da congregação (§5.1).
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
create index on public.eventos (data);

-- ---------- Exceções de ensaio local ----------
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

-- ---------- Circulares ----------
create table public.circulares (
  id           uuid primary key default gen_random_uuid(),
  numero       text not null,            -- "Circular 08/2026"
  titulo       text not null,
  resumo       text,
  data         date not null,
  origem       text not null default 'upload' check (origem in ('upload','link')),
  arquivo_path text,                     -- caminho no bucket 'circulares'
  arquivo_nome text,
  url          text,                     -- usado quando origem = 'link'
  publicado    boolean not null default true,
  constraint circular_tem_origem check (
    (origem = 'upload' and arquivo_path is not null) or
    (origem = 'link'   and url is not null)
  )
);

-- ---------- Secretaria: arquivos ----------
create type tipo_arquivo as enum
  ('pdf','planilha','documento','formulario','pasta','video','link');

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
  tipo          tipo_arquivo not null default 'pdf',
  -- Origem: 'upload' = hospedado no Supabase Storage (padrão);
  --         'link'   = endereço externo (pasta do Drive, formulário, vídeo).
  origem        text not null default 'upload' check (origem in ('upload','link')),
  arquivo_path  text,                    -- caminho no bucket 'arquivos'
  arquivo_nome  text,                    -- nome original, usado no download
  tamanho_bytes bigint,
  url           text,                    -- usado quando origem = 'link'
  versao        int  not null default 1, -- incrementa a cada substituição
  prazo         text,                    -- texto curto, exibido em vermelho
  exemplo       boolean not null default false,
  ordem         int  not null default 0,
  ativo         boolean not null default true,
  atualizado_em timestamptz not null default now(),
  constraint arquivo_tem_origem check (
    (origem = 'upload' and arquivo_path is not null) or
    (origem = 'link'   and url is not null)
  )
);

-- ---------- Secretaria: dúvidas ----------
create table public.duvidas (
  id       uuid primary key default gen_random_uuid(),
  pergunta text not null,
  resposta text not null,
  ordem    int not null default 0,
  ativo    boolean not null default true
);

-- ---------- Ajustes do portal (chave/valor) ----------
create table public.ajustes (
  chave     text primary key,
  valor     text not null default '',
  descricao text
);
```

Chaves de `ajustes` da semente: `instituicao`, `regiao`, `titulo`, `subtitulo`,
`localidade`, `contato`, `hero_texto`, `rodape_nota`, `indexavel` (§8.1).

### 4.3 RLS

Duas funções `security definer` evitam recursão de política:

```sql
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.perfis p
    where p.id = auth.uid() and p.ativo and p.papel = 'admin'
  );
$$;

create or replace function public.pode_editar(a portal_area) returns boolean
language sql stable security definer set search_path = public as $$
  select public.is_admin() or exists (
    select 1 from public.perfis p
    join public.perfil_areas pa on pa.perfil_id = p.id
    where p.id = auth.uid() and p.ativo and pa.area = a
  );
$$;
```

Padrão aplicado a **toda** tabela de conteúdo (exemplo com `congregacoes`):

```sql
alter table public.congregacoes enable row level security;

create policy "leitura publica" on public.congregacoes
  for select to anon, authenticated using (ativo);

create policy "edicao por area" on public.congregacoes
  for all to authenticated
  using (public.pode_editar('congregacoes'))
  with check (public.pode_editar('congregacoes'));
```

Mapa área → tabelas:

| Área | Tabelas |
| --- | --- |
| `congregacoes` | `congregacoes` |
| `eventos` | `eventos`, `ensaio_excecoes`, `tipos_evento` |
| `circulares` | `circulares` |
| `arquivos` | `arquivos`, `arquivo_categorias` |
| `duvidas` | `duvidas` |
| `ajustes` | `ajustes` |
| `usuarios` | `perfis`, `perfil_areas` — **somente `is_admin()`** |

Detalhes importantes:

- Leitura pública filtra por `ativo` / `publicado`. Rascunho nunca vaza.
- `perfis`: cada um lê o próprio registro (`id = auth.uid()`); só admin lê e
  escreve todos. Ninguém altera o próprio `papel` — o `with check` de
  auto-edição exclui as colunas `papel` e `ativo`.
- Nenhuma rota pública usa a chave secreta. O portal lê com a chave
  publicável, sob RLS.

### 4.4 Storage

O portal **hospeda os próprios arquivos**. Subir uma ficha nova é escolher o PDF
no CMS — sem passar pelo Drive, sem ajustar compartilhamento, sem colar link.

| Bucket | Leitura | Escrita | Conteúdo | Limite |
| --- | --- | --- | --- | --- |
| `congregacoes` | pública | `pode_editar('congregacoes')` | fotos das comuns | 5 MB |
| `arquivos` | pública | `pode_editar('arquivos')` | fichas, calendários e demais PDFs da Secretaria | 25 MB |
| `circulares` | pública | `pode_editar('circulares')` | PDFs das circulares | 25 MB |

```sql
-- Exemplo de política de escrita no bucket 'arquivos'
create policy "editores da area escrevem arquivos"
  on storage.objects for all to authenticated
  using      (bucket_id = 'arquivos' and public.pode_editar('arquivos'))
  with check (bucket_id = 'arquivos' and public.pode_editar('arquivos'));
```

**Convenção de caminho:** `<categoria-slug>/<arquivo-slug>.pdf` — estável e
legível, ex.: `fichas-musicos/pedido-avaliacao-ensaios.pdf`.

**Substituição preserva o endereço.** Subir uma versão nova faz `upsert` no
mesmo caminho e incrementa `arquivos.versao`; o portal serve a URL com
`?v=<versao>` para furar o cache do CDN. Consequência prática: um link do
arquivo que alguém salvou ou mandou no grupo **continua valendo** e passa a
apontar para a versão nova. Era exatamente o atrito do modelo antigo, em que
cada versão nova virava um link novo no Drive.

**Tipos aceitos:** PDF, imagem, e os formatos de planilha e documento
(`xlsx`, `docx`). O CMS valida extensão e tamanho antes de enviar; fotos de
congregação são redimensionadas no cliente.

**Link externo continua existindo**, como exceção (`origem = 'link'`): serve
para pasta compartilhada do Drive, formulário do Google e vídeo — coisas que não
são arquivo para baixar. O padrão do formulário é **upload**.

> **Espaço:** o plano gratuito do Supabase dá 1 GB de Storage. Fichas e
> calendários em PDF ocupam poucos MB — folga larga para uma regional. Se um dia
> apertar, a saída é arquivar circulares antigas, não trocar de modelo.

---

## 5. Regras de negócio

### 5.1 Recorrência de ensaio local

Cada congregação declara um padrão: **ordinal** (1º…4º ou "último"), **dia da
semana**, **hora** e **meses** em que acontece (`null` = todo mês; ou uma lista,
ex.: março, junho, setembro, dezembro). As datas do calendário, a lista de
"próximos ensaios" e a visão por dia da semana são **geradas** desse padrão —
não existem linhas de ensaio local no banco.

Implementação em `lib/ensaios.ts`, funções puras e testadas:

```ts
/** n-ésima ocorrência (1..4) de um dia da semana no mês; null se não existir. */
nthDia(ano, mes, dow, ord): number | null
/** Último `dow` do mês (ord = 5). */
ultimoDia(ano, mes, dow): number
/** Todos os ensaios locais gerados num intervalo, já com exceções aplicadas. */
gerarEnsaios(congregacoes, excecoes, de, ate): Evento[]
```

`ensaio_excecoes` sobrepõe a geração: cancela a data ou a remaneja. É assim que
se registra "o ensaio de dezembro foi antecipado".

**Ensaio local aparece no calendário como qualquer outro evento.** "Gerado" é
detalhe de armazenamento, não de exibição: uma única função monta a lista de
eventos de um período unindo os ensaios gerados aos eventos avulsos da tabela
`eventos`, e **todas** as telas consomem essa lista.

```ts
/** Fonte única de eventos de qualquer tela. Ensaios gerados + eventos avulsos,
 *  exceções aplicadas, ordenados por data e hora. */
eventosDoPeriodo(de: string, ate: string): Promise<Evento[]>
```

Ou seja, o ensaio local aparece:

- na **grade mensal** e na **agenda** do Calendário, com a cor do tipo "Ensaio
  local" e entrando na contagem "+N mais" do dia;
- no **modal do dia**, com hora, comum e link para a congregação;
- em **Próximos eventos** na tela de Início;
- na **busca global**;
- nas três visões da tela de **Ensaios**.

Nada é gerado no navegador: a expansão acontece no servidor, junto da consulta,
para que o conteúdo venha renderizado e a busca alcance as datas.

### 5.2 Todo evento acontece numa congregação

Ensaio regional, teste de músicos, teste de organistas e reunião de secretaria
apontam para uma comum real. Consequência de interface: **todo local é
clicável** e leva ao detalhe da congregação.

### 5.3 Destaques temporais

Ensaio de **hoje** com destaque forte (vermelho + selo "Hoje"); de **amanhã**
com destaque suave (azul + selo "Amanhã"). Vale em todas as visões.

Fuso horário fixo em **`America/Sao_Paulo`**: "hoje" é calculado no servidor
nesse fuso, nunca no relógio do visitante.

### 5.4 Busca global

Um campo no cabeçalho pesquisa congregações, eventos, circulares, arquivos e
dúvidas, com resultados agrupados por área. Comparação sem acento e sem caixa
(`unaccent` no Postgres; normalização equivalente no cliente).

### 5.5 Tipos de evento e cores

| Tipo | Cor |
| --- | --- |
| Ensaio local | `#033d60` |
| Ensaio regional | `#0a6ea3` |
| Reunião de secretaria | `#645f77` |
| Teste de músicos | `#ee1d23` |
| Teste de organistas | `#2aba66` |

Editáveis pelo CMS — uma região que use outra nomenclatura ajusta sem tocar no
código.

---

## 6. Rotas

### 6.1 Portal público

| Rota | Conteúdo |
| --- | --- |
| `/` | Início |
| `/congregacoes` | Grade de cards |
| `/congregacoes/[slug]` | Detalhe (página real + modal por *intercepting route*) |
| `/ensaios` | Três visões alternáveis (`?visao=comum\|semana\|proximos`) |
| `/calendario` | Grade ou agenda (`?mes=YYYY-MM&modo=grade\|agenda`) |
| `/circulares` | Lista com destaque do mais recente |
| `/secretaria` | Arquivos por categoria + dúvidas |
| `/buscar?q=` | Resultados agrupados por área |

O detalhe da congregação usa *parallel + intercepting routes*: clicar no card
abre o modal sem sair da grade, mas a URL vira `/congregacoes/centro` — link
compartilhável, e recarregar a página mostra a versão completa.

### 6.2 CMS (`/admin`)

| Rota | Área | Quem acessa |
| --- | --- | --- |
| `/admin/login` | — | público (envio de link mágico) |
| `/admin` | — | qualquer autenticado ativo |
| `/admin/congregacoes` | `congregacoes` | admin + editor da área |
| `/admin/eventos` | `eventos` | idem |
| `/admin/circulares` | `circulares` | idem |
| `/admin/arquivos` | `arquivos` | idem |
| `/admin/duvidas` | `duvidas` | idem |
| `/admin/ajustes` | `ajustes` | idem |
| `/admin/usuarios` | `usuarios` | **somente admin** |

O menu do CMS mostra apenas as áreas que o usuário pode editar. Isso é
conveniência de interface — a **garantia** é a RLS no banco.

---

## 7. Autenticação

- **Supabase Auth com link mágico por e-mail** (sem senha). É o fluxo mais
  simples para quem vai manter o portal e elimina senha fraca/reaproveitada.
- **Cadastro público desativado** no painel do Supabase. Usuário novo só entra
  por convite de um admin, em `/admin/usuarios`.
- Convite: Server Action chama `auth.admin.inviteUserByEmail` com a chave
  secreta (só no servidor), e já grava `perfis` + `perfil_areas`.
- Sessão em cookies via `@supabase/ssr`; `proxy.ts` (a convenção que
  substituiu `middleware.ts` no Next 16) renova o token e protege tudo sob
  `/admin`, redirecionando para `/admin/login`.
- Trigger `on auth.users insert` cria a linha em `perfis` com `papel='editor'`
  e `ativo=false` — quem não foi convidado não edita nada mesmo que consiga
  autenticar.
- O primeiro admin é criado no `seed.sql` da instalação (§9.3).

---

## 8. Renderização, cache e performance

- Páginas públicas são **Server Components** que leem o Supabase com a chave
  publicável, cacheadas por tag (`congregacoes`, `eventos`, `circulares`,
  `arquivos`, `duvidas`, `ajustes`).
- Toda escrita no CMS é **Server Action** que, ao final, chama `revalidateTag`
  da(s) tag(s) afetada(s). Edição aparece no portal em segundos, sem redeploy.
- Fallback de revalidação por tempo (1 hora), para o caso de uma escrita fora
  do app (direto no Supabase Studio).
- Fotos servidas pelo `next/image` a partir do domínio do Supabase Storage
  (registrar em `images.remotePatterns`).
- O portal público **não depende de JavaScript** para o conteúdo essencial:
  listas, calendário e arquivos vêm renderizados do servidor. JS cuida de
  modal, alternância de visão e busca instantânea.

### 8.1 Aparecer (ou não) no Google — `noindex`

`noindex` é uma instrução que a página manda para os buscadores: *"não me
coloque na lista de resultados"*. O Google e os outros respeitam.

Ela **não é uma proteção**. O portal continua aberto na internet: quem tiver o
endereço abre normalmente, com ou sem `noindex`. A diferença é só se o site
aparece quando alguém procura "portal música Bragança" no Google.

| Com `noindex` | Sem `noindex` (**escolha deste projeto**) |
| --- | --- |
| Acesso só pelo link, divulgado no grupo | Qualquer um acha buscando |
| Circulação interna da secretaria | Vira o endereço público da regional |
| Quem perde o link fica sem o portal | Quem perde o link busca e reencontra |

**Decisão: o portal é indexável.** O conteúdo é institucional e público por
natureza — endereços de comuns, datas de ensaio, circulares e fichas em branco.
Ser achável no Google é o que faz o portal servir a quem não está no grupo do
WhatsApp e a quem perdeu o link, e ajuda outras regionais a descobrirem o
projeto.

Como isso é divulgação e não segurança, a escolha continua da regional: fica na
tabela `ajustes` (chave `indexavel`, padrão `sim`), e o `app/robots.ts` +
`metadata.robots` leem esse valor. Uma região que prefira circulação restrita
troca no CMS, sem mexer em código.

Consequências de ser indexável, que o projeto assume:

- `sitemap.ts` com as rotas públicas e as congregações.
- `metadata` por página: título, descrição e Open Graph (o link fica com
  prévia decente quando compartilhado no WhatsApp).
- `/admin` sempre `noindex`, em qualquer configuração.
- A regra do §2 fica ainda mais firme: **nada de dado pessoal**. Agora não é só
  "está na internet" — é "está no Google".

> Se um dia algo realmente sigiloso precisar entrar no portal, a resposta certa
> é autenticação, nunca `noindex`. Ver a regra do §2: dado pessoal não entra.

---

## 9. Instalação em outra região

Pré-requisitos: conta no GitHub, conta na Vercel, conta no Supabase, Node 20+ e
a CLI do Supabase. Tudo em plano gratuito.

### 9.1 Clonar

```bash
git clone https://github.com/<usuario>/portal-musica.git
cd portal-musica
npm install
```

### 9.2 Criar o projeto Supabase e aplicar o schema

```bash
supabase login
supabase link --project-ref <ref-do-projeto>
supabase db push          # aplica supabase/migrations/
```

Variáveis de ambiente (`.env.local`, e as mesmas na Vercel):

```bash
NEXT_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<publishable key>   # legado: anon key
SUPABASE_SECRET_KEY=<secret key>                         # legado: service_role
NEXT_PUBLIC_SITE_URL=https://<seu-portal>.vercel.app     # usado no link mágico
```

> `SUPABASE_SECRET_KEY` é **somente servidor** (sem `NEXT_PUBLIC_`). Ela ignora
> RLS; vazar essa chave é entregar o banco.

### 9.3 Semear os dados da região

`supabase/seed.sql` traz tipos de evento, categorias de arquivo, dúvidas e
ajustes com textos genéricos — nenhum dado de Bragança. Preencha as
congregações da sua região e rode:

```bash
supabase db execute --file supabase/seed.sql
```

Primeiro admin: crie o usuário no painel (Authentication → Users → Invite) e
promova:

```sql
update public.perfis set papel = 'admin', ativo = true where email = 'voce@exemplo.com';
```

### 9.4 (Opcional) Migrar do portal antigo de planilha

`scripts/importar-planilha.ts` lê as abas `Arquivos`, `Duvidas`, `Categorias` e
`Ajustes` do portal em planilha e escreve nas tabelas correspondentes. Use uma
vez, na instalação.

O script tenta ainda **baixar cada arquivo do link atual** (Drive/OneDrive) e
subir para o bucket `arquivos`, para que o portal passe a hospedar o conteúdo.
Link que exigir login não é baixável por script: esses ficam registrados como
`origem = 'link'` e o relatório final lista quais precisam de upload manual no
CMS.

### 9.5 Publicar

Importe o repositório na Vercel, cole as variáveis de ambiente e faça o deploy.
Em Supabase → Authentication → URL Configuration, cadastre a URL do site nas
*Redirect URLs*, senão o link mágico não volta para o portal.

### 9.6 Personalizar

Tudo que é texto e conteúdo está no CMS (`/admin/ajustes`). Mexer em código só
é preciso para mudar cor, tipografia ou estrutura de página.

---

## 10. Estrutura do repositório

```
portal-musica/
├── app/
│   ├── robots.ts          # lê ajustes.indexavel
│   ├── sitemap.ts
│   ├── (site)/            # portal público
│   │   ├── page.tsx                    # Início
│   │   ├── congregacoes/
│   │   │   ├── page.tsx
│   │   │   ├── [slug]/page.tsx
│   │   │   └── @modal/(.)[slug]/page.tsx
│   │   ├── ensaios/  calendario/  circulares/  secretaria/  buscar/
│   │   └── layout.tsx     # faixa institucional, cabeçalho, menu, rodapé
│   └── admin/             # CMS
│       ├── login/  congregacoes/  eventos/  circulares/
│       ├── arquivos/  duvidas/  ajustes/  usuarios/
│       └── layout.tsx     # menu filtrado pelas áreas do usuário
├── components/            # site/, admin/, icones/
├── lib/
│   ├── supabase/          # config, publico, servidor, navegador, admin
│   ├── tipos-banco.ts     # tipos do schema (regenerar com a CLI)
│   ├── ensaios.ts         # recorrência (funções puras)
│   ├── datas.ts           # formatação PT-BR, fuso America/Sao_Paulo
│   ├── busca.ts           # normalização e ranqueamento
│   ├── permissoes.ts      # áreas do usuário
│   └── schemas.ts         # Zod, compartilhado formulário ↔ Server Action
├── supabase/
│   ├── migrations/        # schema versionado
│   └── seed.sql           # dados genéricos de partida
├── scripts/importar-planilha.ts
├── docs/ARQUITETURA.md    # este documento
├── proxy.ts               # renova sessão e protege /admin
├── LICENSE                # MIT
├── CONTRIBUTING.md
└── README.md              # visão geral + guia de instalação resumido
```

---

## 11. Licença e governança

- **MIT**, titular **Kelwin Savoia**, ano de publicação no arquivo `LICENSE`.
- O projeto é **não-oficial**: uma ferramenta feita por voluntário para apoiar o
  trabalho de secretaria. O `README` diz isso de forma explícita, e nenhum
  emblema oficial da CCB é usado — a marca do portal é uma clave neutra.
- Nenhum dado de irmãos no repositório: seed genérico, exemplos fictícios,
  nenhum link privado versionado.
- `CONTRIBUTING.md`: como rodar localmente, padrão de commit, e o pedido de que
  contribuições não incluam conteúdo específico de uma região.

---

## 12. Plano de execução

| Fase | Entrega |
| --- | --- |
| 1 | Repositório novo, Next.js + Tailwind + shadcn, layout base (faixa, cabeçalho, menu, rodapé) com os tokens da CCB, LICENSE MIT. |
| 2 | Supabase: migrações, RLS, seed, buckets. Tipos TypeScript gerados. |
| 3 | Portal público lendo do banco: Congregações, Secretaria (paridade com o portal atual), Início. |
| 4 | `lib/ensaios.ts` + `eventosDoPeriodo()` + testes; telas de Ensaios e Calendário (com os ensaios locais gerados). |
| 5 | Circulares e busca global. |
| 6 | CMS: login por link mágico, CRUD das áreas, **upload de arquivos e fotos com substituição versionada**, revalidação por tag. |
| 7 | `/admin/usuarios`: convite, papel e áreas. |
| 8 | Importador da planilha (**baixa os arquivos dos links atuais e sobe para o bucket**), deploy de produção, migração do domínio atual. |
| 9 | README de adoção, `CONTRIBUTING.md`, e abertura do repositório. |

---

## 13. Em aberto

- **Domínio.** Manter `portal-musica-pi.vercel.app` ou registrar um domínio
  próprio antes de divulgar para outras regiões.
- **Ensaios de RJM.** O protótipo trata como ensaio regional; pode virar tipo
  próprio.
- **Menu mobile.** O protótipo quebra o menu em duas linhas; decidir entre isso
  e um menu recolhível.
- **Histórico de circulares.** Se o volume crescer, paginar ou filtrar por ano.
- **Notificação.** Avisar de circular nova (e-mail? nada?) — fora do escopo
  inicial, e esbarra na regra de não guardar dado pessoal.
