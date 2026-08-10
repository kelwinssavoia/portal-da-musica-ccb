# Instalar o portal na sua região

Guia completo, do zero ao portal no ar. Leva cerca de meia hora e roda inteiro
no **plano gratuito** da Vercel e do Supabase.

Cada regional tem a **própria instância**: o próprio banco, os próprios
arquivos, o próprio endereço. Nada é compartilhado, e nenhum dado da sua região
passa por terceiros.

> Este roteiro é o mesmo que foi usado para subir a instância da Região
> Bragantina. Os passos estão na ordem em que funcionam de verdade — inclusive a
> criação do primeiro administrador, que é o ponto onde é fácil travar.

---

## Antes de começar

Você vai precisar de:

- conta no [GitHub](https://github.com), no [Supabase](https://supabase.com) e
  na [Vercel](https://vercel.com) — todas gratuitas;
- **Node.js 20 ou mais novo** instalado;
- meia hora sem pressa.

Não precisa saber programar. Precisa saber copiar e colar com atenção.

---

## 1. Copiar o projeto

No GitHub, abra <https://github.com/kelwinssavoia/portal-da-musica-ccb> e clique
em **Fork**. Isso cria uma cópia na sua conta.

Depois, no terminal:

```bash
git clone https://github.com/SEU-USUARIO/portal-da-musica-ccb.git
cd portal-da-musica-ccb
npm install
```

---

## 2. Criar o projeto no Supabase

O Supabase é o banco de dados, o login e o armazenamento dos arquivos.

1. Em <https://supabase.com/dashboard>, clique em **New project**.
2. Dê um nome (ex.: `portal-musica-sua-regiao`).
3. Em **Region**, escolha **South America (São Paulo)** — é a mais próxima e a
   mais rápida para quem acessa do Brasil.
4. Guarde a senha do banco que ele pedir. Você não vai usar neste guia, mas
   perder essa senha dá trabalho depois.

> **Atenção ao limite do plano gratuito:** a conta permite **2 projetos ativos**.
> Se você já tem dois, o Supabase recusa criar o terceiro. Nesse caso, pause um
> projeto que não está em uso ou crie o portal em outra conta.

### 2.1 Aplicar o banco

O projeto traz a estrutura do banco versionada em `supabase/migrations/`.

```bash
npx supabase login
npx supabase link --project-ref SEU-REF
npx supabase db push
```

O **ref** é o código no meio do endereço do painel:
`https://supabase.com/dashboard/project/`**`xxkldtlpvfmzxsmhkvqa`**.

Depois, os dados de partida (tipos de evento, categorias de arquivo, textos
genéricos e dúvidas de exemplo):

```bash
npx supabase db execute --file supabase/seed.sql
```

---

## 3. Ligar o portal ao Supabase

No painel do Supabase, vá em **Project Settings → API keys**. Copie:

- a **Publishable key** (`sb_publishable_...`) — pode ficar no navegador;
- a **Secret key** (`sb_secret_...`) — **só no servidor**, nunca no navegador.

Crie o arquivo `.env.local` na raiz do projeto:

```bash
cp .env.example .env.local
```

E preencha:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://SEU-REF.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
SUPABASE_SECRET_KEY=sb_secret_...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

> A **secret key ignora todas as regras de permissão do banco**. Vazar essa
> chave é entregar o portal inteiro. Ela nunca leva o prefixo `NEXT_PUBLIC_`, e o
> `.env.local` já está fora do controle de versão.

Teste:

```bash
npm run dev
```

Abra <http://localhost:3000>. O portal deve aparecer com os textos genéricos
("Sua Região"). Se aparecer assim, o banco está ligado.

---

## 4. Fechar o cadastro

No painel do Supabase, em **Authentication → Sign In / Providers**:

1. Deixe **Email** habilitado — é o tipo de identidade usado no login.
2. Desligue **Allow new users to sign up**. Sem isso, qualquer pessoa poderia
   criar conta e tentar entrar na área de manutenção.
3. Em **Confirm email**, deixe desligado: o portal cria os acessos já
   confirmados, porque **não envia e-mail nenhum**.

> **O portal não depende de serviço de e-mail.** O login é por e-mail e senha, e
> quem cria um acesso recebe a senha provisória na tela, para passar à pessoa
> pelo canal que a secretaria já usa. Isso elimina SMTP, domínio de remetente,
> template de mensagem e limite de envio — quatro coisas que dariam trabalho e
> não agregam nada ao portal.

---

## 5. Criar o primeiro administrador

Este é o passo onde mais gente trava. A ordem importa.

1. **Authentication → Users → Add user → Create new user**.
2. Informe seu e-mail, defina uma senha (mínimo 10 caracteres) e marque
   **Auto Confirm User**.
3. Agora abra **SQL Editor** e rode, trocando pelo seu e-mail:

```sql
update public.perfis
set papel = 'admin', ativo = true
where email = 'voce@exemplo.com';
```

Por que esse `update` é necessário: todo usuário que entra no sistema nasce
**inativo e sem permissão nenhuma** — é essa a proteção contra quem não foi
convidado. Alguém precisa ser promovido "de fora", e é isso que o SQL acima faz.

> Se aparecer o erro *"Somente administradores alteram papel ou situação de
> acesso"*, seu banco está com uma versão antiga da migração. Rode
> `npx supabase db push` novamente para aplicar
> `20260810120000_corrige_protege_papel.sql`.

Confirme que deu certo:

```sql
select email, papel, ativo from public.perfis;
```

Deve aparecer `admin` e `true`.

---

## 6. Publicar na Vercel

```bash
npx vercel login
npx vercel link --yes --project portal-musica-sua-regiao
```

Cadastre as variáveis de ambiente (o comando pede o valor de cada uma):

```bash
npx vercel env add NEXT_PUBLIC_SUPABASE_URL production
npx vercel env add NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY production
npx vercel env add SUPABASE_SECRET_KEY production
npx vercel env add NEXT_PUBLIC_SITE_URL production
```

Em `NEXT_PUBLIC_SITE_URL`, use o endereço que a Vercel vai gerar — normalmente
`https://SEU-PROJETO.vercel.app`. Se ainda não souber, publique uma vez, veja o
endereço e cadastre depois, publicando de novo.

```bash
npx vercel deploy --prod --yes
```

Para que todo `git push` publique sozinho:

```bash
npx vercel git connect --yes
```

---

## 7. Testar o acesso

Abra `https://seu-portal.vercel.app/admin` e entre com o e-mail e a senha do
passo 5. Você deve cair no painel de manutenção.

Não há nada a configurar no Supabase para o login funcionar em produção — sem
e-mail no caminho, não existem "Redirect URLs" para acertar.

---

## 8. Cadastrar o conteúdo da sua região

Tudo pelo painel, em `/admin` — nada de mexer em código.

Sugestão de ordem:

1. **Ajustes** — nome da região, títulos, texto de apresentação, rodapé.
2. **Congregações** — uma por uma: endereço, culto oficial e o **padrão de
   ensaio local** (qual do mês + dia da semana + hora + em quais meses).
3. **Arquivos** — crie as categorias que fazem sentido e suba as fichas.
4. **Dúvidas** — as respostas do seed são genéricas. **Reescreva todas** com o
   que vale na sua região.
5. **Eventos** — ensaios regionais, testes e reuniões.
6. **Usuários** — cadastre os irmãos da secretaria, cada um com as áreas dele.
   O portal mostra a senha provisória de cada um na hora; passe para a pessoa e
   peça que ela troque em **Minha senha**.

> **Confira as datas de ensaio antes de divulgar o portal.** O calendário é
> gerado do padrão que você cadastrar; um ordinal errado espalha data errada para
> a regional inteira. Abra a tela **Ensaios** e compare com o calendário oficial
> antes de mandar o link para alguém.

---

## 9. Duas decisões finais

**Aparecer no Google?** Em **Ajustes**, a opção "O portal pode aparecer no
Google" vem ligada. Isso é divulgação, não segurança: com ou sem ela, quem tem o
link abre o portal. Desligue se a sua regional preferir circulação restrita.

**Nada de dado pessoal.** O portal é público na internet. Endereço de comum,
data de ensaio, circular e ficha em branco, sim. Nome de irmão, telefone, e-mail
ou lista de músicos e organistas, **nunca** — nem em observação, nem em
descrição de arquivo, nem em resposta de dúvida.

---

## Deu problema?

| Sintoma | Causa mais provável |
| --- | --- |
| Portal mostra "Sua Região" em produção | Variáveis de ambiente não cadastradas na Vercel, ou publicou antes de cadastrá-las |
| "E-mail ou senha incorretos" mesmo com a senha certa | Senha com menos de 10 caracteres, ou usuário criado sem **Auto Confirm User** |
| Alguém esqueceu a senha | Um admin redefine em **Usuários → a pessoa → Redefinir senha**. Não há recuperação por e-mail |
| "Somente administradores alteram papel" | Migração `20260810120000` não aplicada (passo 5) |
| Entrei, mas o menu está vazio | Perfil ativo, porém sem áreas. Um admin precisa atribuir as áreas em **Usuários** |
| Salvei e o portal não mudou | Confira se salvou na área certa; se persistir, abra uma issue |
| Supabase recusa criar o projeto | Limite de 2 projetos ativos no plano gratuito (passo 2) |

Ainda travado? Abra uma issue em
<https://github.com/kelwinssavoia/portal-da-musica-ccb/issues> descrevendo o
passo e a mensagem exata. Ajuda outras regiões também.
