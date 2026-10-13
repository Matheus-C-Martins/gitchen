# Gitchen

Online recipe book built with React, TypeScript, Vite, Tailwind CSS and Supabase.

App: https://matheus-c-martins.github.io/gitchen/

## How it works

- Anyone can read the recipes.
- To add recipes you need to sign in with GitHub.
- Each user can only edit and delete their own recipes.
- Each recipe shows the name and avatar of the person who created it.

## Running locally

```bash
git clone https://github.com/Matheus-C-Martins/gitchen.git
cd gitchen
cp .env.example .env.local
npm install
npm run dev
```

The app runs at http://localhost:5173/gitchen/. This address must be in Supabase's Redirect URLs list (Authentication → URL Configuration) for login to work.

## Environment variables

| Variable | Description |
|---|---|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Publishable key (`sb_publishable_...`) |

Both are public by design and end up in the bundle. Never use a `secret` or `service_role` key here. The Client Secret of the GitHub OAuth App stays only in the Supabase dashboard.

## Security

Protection lives in the database, not in the frontend:

- Row Level Security enabled on `profiles` and `recipes`.
- Public read access; insert, update and delete only for authenticated users and only on their own rows.
- Field size limits and a quota of 200 recipes per user.
- Table privileges explicitly granted to the `anon` and `authenticated` roles.

## Database types

`src/lib/database.types.ts` is generated from Supabase. To update it after changing the schema:

```bash
npx supabase gen types typescript --project-id eorykepcebenwqufoqky > src/lib/database.types.ts
```

## Deploy

Every push to `main` publishes to GitHub Pages through `.github/workflows/deploy.yml`. Pull requests run the build in `.github/workflows/ci.yml`.

## Scripts

- `npm run dev`: development server
- `npm run build`: type-checks and produces the build
- `npm run preview`: serves the build locally
