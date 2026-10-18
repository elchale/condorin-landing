# Ojo de Cóndor

Ojo de Cóndor monitors illegal gold mining in the Peruvian Amazon (river dredges and open-pit mines) from satellite imagery and alerts people by WhatsApp.

This repository is only the admin panel, served at https://admin.condorin.pe. `/` redirects to `/admin`.
The public site (map, sign in, member panel, expediente pages) is the Vite SPA in
[condorin-new-front](https://github.com/elchale/condorin-new-front) at https://www.condorin.pe, which talks
only to the Django API.

## Stack

- Next.js 16 (App Router) with TypeScript and React 19
- Tailwind CSS 4
- Prisma 7 on Neon Postgres, shared with the Django backend ([condorin-backend](https://github.com/elchale/condorin-backend)), which owns the schema and runs every migration

## Getting started

```bash
npm install
cp .env.example .env.local   # then fill in the values
# the tables come from the backend: run `python manage.py migrate` there
npm run dev
```

Open http://localhost:3000/admin.

`src/proxy.ts` answers 404 for any path outside `/admin`, `/api/admin`, `/_next` and static files (page
requests are redirected to https://www.condorin.pe instead), so nothing of the old public site can come back
by accident. `next.config.ts` sets the security headers (CSP, HSTS, frame denial, `X-Robots-Tag: noindex`).

## Admin panel

`/admin` is a private panel (not indexed) that signs in with Google.

1. `/admin/entrar` links to `GET /api/admin/oauth/start`, which redirects to Google (authorization code flow with PKCE, state and nonce kept in a short-lived signed cookie).
2. `GET /api/admin/oauth/callback` exchanges the code server side, checks the id_token, and issues an 8-hour signed session cookie only if the verified email has an active row in the `Admin` table.
3. Every admin page calls `requireAdmin()`, which re-checks that row on each request, so setting `active = false` locks someone out immediately.

`/admin/en-vivo` shows every satellite scene as it arrives and animates each decision Ojo de Cóndor took about it (threshold, ONGs, WhatsApp alerts, expediente, filing). It polls `GET /api/admin/actividad` every 4 seconds, an admin only proxy to the API's `/api/v1/panel/actividad`. Open `/admin/en-vivo?demo=1` for a demonstration with simulated data (a new scene about every 12 seconds that advances over time); the page also offers it when the API is unavailable or has no events.

Add an admin directly in the database:

```sql
INSERT INTO "Admin" (id, email, name) VALUES (gen_random_uuid()::text, 'someone@example.com', 'Name');
```

To add a section, add an entry to `src/lib/admin/sections.ts` (it feeds the sidebar and the overview) and a page under `src/app/admin/(panel)/` that starts with `await requireAdmin()`.

## Project layout

```
src/
  app/                  routes: /admin, /api/admin handlers, / (redirect to /admin)
  components/
    admin/              panel shell, navigation, formatting helpers, live feed (live/demo.ts is demo mode only)
    brand/              logo
    ui/                 icons
  lib/                  server helpers: env, db, Django API client, cookies
  lib/admin/            Google OAuth, admin session, guard, panel sections and queries
  proxy.ts              allowlist of paths this app serves
prisma/                 schema (maps the Django tables)
scripts/generate-og.mjs builds src/app/opengraph-image.jpg (link preview image)
```

## Before production

- Set `NEXT_PUBLIC_SITE_URL=https://admin.condorin.pe` on Vercel.
- On Vercel, set every variable from `.env.example`.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript without emitting |
| `npm run og` | Regenerate the link preview image |

## Database

`prisma/schema.prisma` only maps onto tables created by Django (`accounts_member`, `accounts_admin`). Never run `prisma migrate` or `prisma db push`. When a Django migration changes those tables, update the mapping and run `npx prisma generate`.
