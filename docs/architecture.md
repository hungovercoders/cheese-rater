# Architecture

Derived from `src/main.tsx`, `src/App.tsx`, `vite.config.ts`, `netlify.toml` and `.github/workflows/deploy-netlify.yml`.

## Context

```mermaid
C4Context
  title CheeseRater system context
  Person(visitor, "Visitor", "Browses, rates and wishlists cheeses under a nickname")
  Person(owner, "Owner", "Adds cheeses; identified by the Spark runtime")
  System(app, "CheeseRater SPA", "React 19 + Vite, built with GitHub Spark")
  System_Ext(spark, "GitHub Spark runtime", "/_spark/kv store, /_spark/user identity")
  System_Ext(netlify, "Netlify", "Static hosting of the Vite build; no /_spark backend")
  System_Ext(retailers, "Retailer sites", "purchaseUrl targets, opened in a new tab")
  Rel(visitor, app, "uses")
  Rel(owner, app, "curates")
  Rel(app, spark, "reads and writes KV, checks owner", "fetch")
  Rel(netlify, app, "serves")
  Rel(app, retailers, "links out")
```

## Containers

```mermaid
C4Container
  title CheeseRater containers
  Person(user, "Visitor or owner")
  Container_Boundary(repo, "This repository") {
    Container(spa, "Browser SPA", "React 19, Tailwind 4, shadcn/ui", "src/: App.tsx owns state; components render it; lib/ filters and rates")
    Container(build, "Vite build", "Vite 7 + @github/spark plugin", "dist/: index.html, assets/, proxy.js wrapper for the Spark runtime")
    Container(ci, "Deploy workflow", "GitHub Actions", ".github/workflows/deploy-netlify.yml")
  }
  System_Ext(kv, "Spark KV", "keys: cheeses, reviews, user-profile")
  System_Ext(identity, "Spark user endpoint", "/_spark/user returns isOwner")
  System_Ext(netlify, "Netlify", "builds via netlify.toml, serves dist/")
  Rel(user, spa, "uses")
  Rel(spa, kv, "useKV", "fetch /_spark/kv/<key>")
  Rel(spa, identity, "window.spark.user()", "fetch /_spark/user")
  Rel(build, spa, "produces")
  Rel(ci, netlify, "deploys on push to main; previews PRs", "NETLIFY_AUTH_TOKEN, NETLIFY_SITE_ID")
  Rel(netlify, spa, "serves")
```

## Notes

- `src/vite-end.d.ts` declares `BASE_KV_SERVICE_URL` and `GITHUB_RUNTIME_PERMANENT_NAME`; the Spark Vite plugin defines them at build time (`/_spark/kv` and the app id in `runtime.config.json`).
- KV keys are app-wide, not per user. `user-profile` therefore holds one nickname, wishlist and tried list for everyone.
- The per-device id in localStorage (`src/lib/cheese-utils.ts`) is the only user scoping; it matches a review to its author for editing.
