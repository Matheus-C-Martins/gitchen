# Gitchen

Livro de receitas online, feito com React, TypeScript, Vite, Tailwind CSS e Supabase.

App: https://matheus-c-martins.github.io/gitchen/

## Como funciona

- Qualquer pessoa pode ler as receitas.
- Para adicionar receitas é preciso iniciar sessão com o GitHub.
- Cada utilizador só pode editar e apagar as suas próprias receitas.
- Cada receita mostra o nome e o avatar de quem a criou.

## Correr localmente

```bash
git clone https://github.com/Matheus-C-Martins/gitchen.git
cd gitchen
cp .env.example .env.local
npm install
npm run dev
```

A app fica em http://localhost:5173/gitchen/. Esse endereço tem de estar na lista de Redirect URLs do Supabase (Authentication → URL Configuration) para o login funcionar.

## Variáveis de ambiente

| Variável | Descrição |
|---|---|
| `VITE_SUPABASE_URL` | URL do projeto Supabase |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Chave publicável (`sb_publishable_...`) |

Ambas são públicas por desenho e vão no bundle. Nunca uses aqui uma chave `secret` ou `service_role`. O Client Secret da OAuth App do GitHub fica só no painel do Supabase.

## Segurança

A proteção está na base de dados e não no frontend:

- Row Level Security ativo em `profiles` e `recipes`.
- Leitura pública; inserir, editar e apagar só para utilizadores autenticados e só nas linhas próprias.
- Limites de tamanho nos campos e quota de 200 receitas por utilizador.
- Privilégios de tabela concedidos explicitamente aos papéis `anon` e `authenticated`.

## Tipos da base de dados

`src/lib/database.types.ts` é gerado a partir do Supabase. Para o atualizar depois de mudar o esquema:

```bash
npx supabase gen types typescript --project-id eorykepcebenwqufoqky > src/lib/database.types.ts
```

## Deploy

Cada push para `main` publica no GitHub Pages através de `.github/workflows/deploy.yml`. As pull requests correm o build em `.github/workflows/ci.yml`.

## Scripts

- `npm run dev`: servidor de desenvolvimento
- `npm run build`: verifica os tipos e gera o build
- `npm run preview`: serve o build localmente
