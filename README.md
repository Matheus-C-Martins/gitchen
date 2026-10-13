# Gitchen

Online recipe book built with React, TypeScript, Vite, Tailwind CSS and Supabase.

App: https://matheus-c-martins.github.io/gitchen/

## How it works

- Anyone can read the recipes.
- To add recipes you need to sign in with GitHub.
- Each user can only edit and delete their own recipes.
- Signed-in users can report other people's recipes.
- Admins review the reports and can delete any recipe.
- Each recipe shows the name and avatar of the person who created it.

## Languages and translation

- The interface is available in English and Portuguese, using [react-i18next](https://react.i18next.com/). The first language is picked from the browser (Portuguese if the browser is in Portuguese, English otherwise). The EN/PT button in the header switches it, and the choice is saved in `localStorage`.
- The texts live in `src/locales/en.ts` and `src/locales/pt.ts`. The Portuguese file is typed against the English one, so the build fails if a key is missing.
- Recipes are written by users in whatever language they like. On a recipe page, the Translate button translates the title, ingredients and method into the interface language, using the browser's built-in Translator API (Chrome on desktop). The translation runs on the device: nothing is sent to a server or saved. The first time, the browser may download a language pack. A button switches back to the original text.
- If the browser has no Translator API, the button is hidden. Recipe cards in the list and tags are not translated.

## Moderation

- Any signed-in user can report a recipe from its page, with an optional reason of up to 500 characters. The report button is not shown on your own recipes, and each user can report a given recipe only once.
- Reports are visible only to admins. Admins see a Moderation panel at the top of the home page, listing each report with the recipe, the reason, who reported it and when.
- For each report, an admin can dismiss it (which deletes the report) or delete the recipe, which also removes its photo.
- Admin status is decided in the database by the `is_admin()` function, not in the frontend. The panel is only a convenience: the permissions below are enforced by Row Level Security policies.

| Table | Who can do what |
|---|---|
| `reports` | Signed-in users can create reports as themselves. Only admins can read or delete them. |
| `recipes` | Owners can delete their own recipes. Admins can delete any recipe. |

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
- Public read access; insert, update and delete only for authenticated users and only on their own rows. The one exception is that admins can also delete any recipe (see Moderation).
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
