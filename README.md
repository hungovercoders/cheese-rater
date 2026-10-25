# CheeseRater.co.uk

A single-page app for discovering and rating artisan cheeses, live at https://cheeserater.co.uk. The owner curates the catalogue; visitors rate cheeses, keep a wishlist and a tried list under a nickname. Product scope and design intent: read [PRD.md](PRD.md). How the pieces fit and what they depend on: read [docs/architecture.md](docs/architecture.md).

Built with GitHub Spark: React 19, Vite 7, Tailwind 4 and shadcn/ui. State persists through Spark's KV store (`useKV` from `@github/spark/hooks`), which only exists under Spark hosting (see Hosting).

## Setup

- Node 24, pinned in `mise.toml` (`mise install`).
- `npm install`. `npm ci` fails on a clean clone: `package-lock.json` links `@github/spark` to the workspace `packages/spark-tools`, which only the Spark workbench provides and `.gitignore` excludes.
- No `.env` is needed. `PROJECT_ROOT` (read in `vite.config.ts`) is set by the Spark workbench; leave it unset locally.

## Commands

| Task | Command | Green looks like |
|---|---|---|
| dev server | `npm run dev` | Vite on http://localhost:5000 (port set by the Spark Vite plugin); `npm run kill` frees the port |
| build | `npm run build` | `dist/` holding `index.html`, `assets/` and Spark's `proxy.js` wrapper |
| lint | `npm run lint` | currently fails: no `eslint.config.js` exists |
| tests | none | |

## Layout

- `src/App.tsx`: all state and handlers; the only file that touches `useKV`.
- `src/components/`: feature components; `src/components/ui/` is the shadcn/ui kit.
- `src/lib/types.ts` and `src/lib/cheese-utils.ts`: data shapes, filtering, sorting, rating maths.
- `src/index.css`: the cheese palette and fonts; `src/main.css` and `src/styles/theme.css` are Spark template layers.

## Hosting

- Under Spark hosting, `/_spark/kv` stores data and `/_spark/user` identifies the owner, who sees the Add Cheese button.
- GitHub Actions (`.github/workflows/deploy-netlify.yml`) deploys to Netlify on push to `main` and previews pull requests, using repository secrets `NETLIFY_AUTH_TOKEN` and `NETLIFY_SITE_ID`. Netlify builds with `netlify.toml`.
- Netlify serves static files only: `/_spark/*` falls through to `index.html`, so the live site has no data store and no owner. Roll back by reverting the commit on `main`; the workflow redeploys.

## Data

Spark KV keys: `cheeses`, `reviews` and `user-profile`, all app-wide. The browser keeps a per-device `cheese-user-id` in localStorage (`src/lib/cheese-utils.ts`) to match reviews to their author.
