# Contribuindo

Obrigado pelo interesse. Este portal existe para ser reaproveitado — correção,
melhoria e adaptação são bem-vindas.

## Antes de tudo: duas regras de conteúdo

1. **Nenhum dado pessoal.** Nem no código, nem no seed, nem em exemplo, nem em
   captura de tela: sem nomes de irmãos, telefones, e-mails ou listas de
   músicos e organistas. O portal é público na internet.
2. **Nada específico de uma região no repositório.** Congregações, links,
   circulares e prazos da sua regional ficam no **seu banco**, não no código.
   O `supabase/seed.sql` do projeto é genérico de propósito.

E uma de conteúdo institucional: **não invente regra, prazo ou procedimento
oficial da CCB**. Quando um texto for placeholder, marque como exemplo em vez
de chutar.

## Rodando o projeto

```bash
npm install
cp .env.example .env.local
npm run dev
```

Antes de abrir um PR:

```bash
npm run lint
npm run build      # o build também roda a checagem de tipos
```

## Padrões do código

- **Português** em nomes de arquivo, componentes, tabelas, colunas e
  comentários. O projeto é lido por quem mantém o portal, não só por
  programador.
- **Server Components por padrão.** `"use client"` só quando a tela precisa de
  interação de verdade (modal, alternância de visão).
- **Conteúdo essencial do portal público renderizado no servidor.** Lista,
  calendário e arquivos precisam aparecer com o JavaScript desligado. A busca é
  form GET justamente por isso. O CMS (`/admin`) é exceção declarada: Server
  Action exige JavaScript.
- **Cores e tipografia só pelos tokens** do `app/globals.css`. Nada de cor
  solta no componente.
- **Ícones em SVG de linha** (`components/icones.tsx`). Nunca emoji.
- **A segurança mora na RLS**, não na interface. Esconder um botão é
  conveniência; a política do Postgres é a garantia.

## Commits e PRs

Mensagem de commit no imperativo e em português (`Adiciona filtro por mês na
agenda`). No PR, descreva o que muda para quem usa o portal — e, se mexeu em
banco, inclua a migração em `supabase/migrations/`.

## Abrindo uma issue

Diga o que esperava, o que aconteceu e em qual área do portal. Se for sugestão,
vale explicar o problema de secretaria por trás dela — geralmente há uma
solução mais simples do que a funcionalidade imaginada.

## Adaptando para a sua região

Não precisa de fork "para contribuir": clone, rode e use. Se a adaptação
exigiu mexer no código, isso costuma ser sinal de que faltou um ajuste
configurável — abra uma issue contando, que é exatamente o tipo de melhoria que
o projeto quer.

## Supabase pela linha de comando (opcional)

O repositório traz um `.mcp.json` que liga o [MCP do
Supabase](https://github.com/supabase-community/supabase-mcp) ao projeto, para
quem usa um agente de código. Ele lê o token de uma **variável de ambiente** —
nenhum segredo é versionado:

```bash
# token pessoal em https://supabase.com/dashboard/account/tokens
export SUPABASE_ACCESS_TOKEN=sbp_...
```

Exporte antes de abrir o agente. Sem a variável, o servidor simplesmente não
conecta e o resto do projeto funciona normalmente.
