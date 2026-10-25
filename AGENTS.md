# CheeseRater.co.uk

Single-page cheese catalogue and rating app built with GitHub Spark (React 19, Vite 7, Tailwind 4, shadcn/ui), live at https://cheeserater.co.uk. The owner adds cheeses; visitors rate them and keep a wishlist and a tried list under a nickname.

## Ground rules

- Commands live in `package.json` scripts. Reuse them; add there when nothing covers the need.
- Run `npm run build` before committing. It is the only green check: there are no tests and `npm run lint` has no config.
- Never commit `.dev.vars`, `.env` or `packages/`.
- Data and identity come from `/_spark/kv` and `/_spark/user`, which exist only under Spark hosting. The Netlify site serves `index.html` for both, so it has no data store and no owner.

## Commands

| Task | Command | Green looks like |
|---|---|---|
| install | `npm install` | `npm ci` fails: the lockfile links `@github/spark` to the gitignored workspace `packages/spark-tools` |
| dev server | `npm run dev` | http://localhost:5000 (port set by the Spark Vite plugin); `npm run kill` frees the port |
| build | `npm run build` | `dist/` holding `index.html`, `assets/` and Spark's `proxy.js` wrapper |
| lint | `npm run lint` | fails: no `eslint.config.js` |

Node 24 is pinned in `mise.toml`. No `.env` is needed; `PROJECT_ROOT` in `vite.config.ts` is set by the Spark workbench.

## Layout

- `src/App.tsx`: all state and handlers; the only file that calls `useKV`.
- `src/components/`: feature components. `src/components/ui/`: the shadcn/ui pieces the app uses.
- `src/lib/types.ts`, `src/lib/cheese-utils.ts`: data shapes; filtering, sorting and rating maths.
- `src/index.css`: the cheese palette and fonts. `src/main.css`, `src/styles/theme.css`, `tailwind.config.js`: Spark template layers.
- `.github/workflows/deploy-netlify.yml`, `netlify.toml`: deploy on push to `main`, preview on pull requests; secrets `NETLIFY_AUTH_TOKEN` and `NETLIFY_SITE_ID`.

## Conventions

- Conventional commit messages (`feat:`, `fix:`, `chore:`). Work on a branch and open a pull request; `main` requires one.
- Icons from `@phosphor-icons/react`; styling with Tailwind utilities and the shadcn/ui components.
- Spark KV keys: `cheeses`, `reviews`, `user-profile`, all app-wide. The per-device `cheese-user-id` in localStorage matches a review to its author.

## Gotchas

- `window.spark.user()` resolves to null outside Spark, so `isOwner` is false and Add Cheese is hidden.
- `user-profile` is one shared record: nickname, wishlist and tried list are not per visitor.
- Roll back a bad deploy by reverting the commit on `main`; the workflow redeploys.

## Routes

- Before you change behaviour, scope or design, read [PRD.md](PRD.md): the product and design brief.
- Before you change hosting, storage or anything that touches `/_spark/*` or Netlify, read [docs/architecture.md](docs/architecture.md): C4 context and container views.
