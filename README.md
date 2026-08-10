# Portal da Música

Portal da Secretaria da Música de uma região da Congregação Cristã no Brasil:
congregações, ensaios, calendário, circulares e os arquivos da secretaria — num
lugar só, mantido pelos próprios irmãos por um CMS embutido.

Nasceu na **Região Bragantina** e é distribuído sob licença **MIT**: qualquer
regional pode rodar a própria instância, com os próprios dados.

> **Projeto não-oficial.** É uma ferramenta feita por voluntário para apoiar o
> trabalho de secretaria. Não é um canal oficial da Congregação Cristã no
> Brasil, e nenhum emblema oficial é usado.

## O que ele faz

| Área | O que mostra |
| --- | --- |
| Início | Apresentação, atalhos, próximos eventos e últimas circulares |
| Congregações | Endereço, culto oficial, ensaio local e rota no GPS |
| Ensaios | Quando é o ensaio de cada comum — por comum, por dia da semana ou os próximos do mês |
| Calendário | Grade mensal ou agenda, com ensaios, testes e reuniões |
| Circulares | Comunicados oficiais da regional |
| Secretaria | Fichas, calendários e dúvidas frequentes |

Mais busca global e um CMS em `/admin` para manter tudo isso sem programador.

### Regra de conteúdo

**Nada de dado pessoal no portal.** Sem nomes de irmãos, telefones, e-mails ou
listas de músicos. O portal guarda endereços de comuns, datas, arquivos
institucionais e textos — e fica público na internet.

## Stack

Next.js (App Router) · TypeScript · Tailwind CSS · Supabase (Postgres, Auth e
Storage) · deploy na Vercel. Roda inteiro no plano gratuito das duas.

## Rodar localmente

```bash
git clone https://github.com/kelwinssavoia/portal-da-musica-ccb.git
cd portal-da-musica-ccb
npm install
cp .env.example .env.local   # preencha com os dados do seu Supabase
npm run dev
```

Abra <http://localhost:3000>.

## Usar na sua região

O guia completo de instalação — criar o projeto Supabase, aplicar o schema,
semear os dados e publicar na Vercel — está em
**[docs/ARQUITETURA.md §9](docs/ARQUITETURA.md)**, junto com o modelo de dados,
as regras de permissão e as decisões de projeto.

## Estado atual

Em construção, por fases (ver [§12 do documento de arquitetura](docs/ARQUITETURA.md)).

- [x] **Fase 1** — layout base com a identidade visual da CCB
- [x] **Fase 2** — Supabase: schema, RLS, buckets
- [x] **Fase 3** — Congregações, Secretaria e Início lendo do banco
- [ ] **Fase 4** — Ensaios e Calendário
- [ ] **Fase 5** — Circulares e busca global
- [ ] **Fase 6** — CMS
- [ ] **Fase 7** — usuários e permissões
- [ ] **Fase 8** — importação do portal antigo e produção
- [ ] **Fase 9** — guia de adoção

## Contribuindo

Ver [CONTRIBUTING.md](CONTRIBUTING.md).

## Licença

[MIT](LICENSE) © Kelwin Savoia
