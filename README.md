# Condorin

Condorin monitors illegal gold mining in the Peruvian Amazon (river dredges and open-pit mines) from satellite imagery and alerts people by WhatsApp.

This repository is the public site: the landing page, WhatsApp sign in, the ONG member panel and the expediente page.

## Stack

- Next.js 16 (App Router) with TypeScript and React 19
- Tailwind CSS 4
- Prisma 7 on Neon Postgres, shared with the Django backend ([condorin-backend](https://github.com/elchale/condorin-backend)), which owns the schema and runs every migration
- WhatsApp Cloud API for one-time sign-in codes

## Getting started

```bash
npm install
cp .env.example .env.local   # then fill in the values
# the tables come from the backend: run `python manage.py migrate` there
npm run dev
```

Open http://localhost:3000.

## How sign-in works

1. `POST /api/otp/send` checks consent, normalizes the number and sends a 6-digit code using a WhatsApp **authentication** template.
2. The code is never stored. The browser gets an httpOnly cookie holding only an HMAC of the phone, the expiry and the code.
3. `POST /api/otp/verify` recomputes the HMAC and, on match, records the member in Postgres and sets a signed session cookie (30 days).

Limits: one code per number every 45 seconds, 5 attempts per code, 10-minute expiry.

## Member panel and expediente

- After sign in, `/panel` shows the member's ONG, its detections with the evidence crops, and the next action for
  each (create, continue, file, view). Data comes from the Django API (`/api/v1/panel`), called only from this
  server with `PANEL_API_SECRET` and the signed in phone. For the demo, the API adds every new person to a
  default ONG (TODO in the backend).
- `/expediente/<token>` is the page the WhatsApp alert opens. The token is its whole auth; the browser talks to
  the API through `/api/expedientes/<token>` (same origin, no CORS). Fields autosave on blur; confirming needs a
  WhatsApp code.
- Opening an alert link also signs the member in (`POST /api/enlace`): see "Signing in from the WhatsApp link"
  in the backend README for why that is safe and its limits (7 days, never replaces a session, no bots).

## Admin panel

`/admin` is a private panel (not indexed) that signs in with Google.

1. `/admin/entrar` links to `GET /api/admin/oauth/start`, which redirects to Google (authorization code flow with PKCE, state and nonce kept in a short-lived signed cookie).
2. `GET /api/admin/oauth/callback` exchanges the code server side, checks the id_token, and issues an 8-hour signed session cookie only if the verified email has an active row in the `Admin` table.
3. Every admin page calls `requireAdmin()`, which re-checks that row on each request, so setting `active = false` locks someone out immediately.

Add an admin directly in the database:

```sql
INSERT INTO "Admin" (id, email, name) VALUES (gen_random_uuid()::text, 'someone@example.com', 'Name');
```

When someone signs up for the first time, every active admin gets an email (Qolca SendGrid SMTP, sent after the response so sign-in never waits on it). Recipients are read from the `Admin` table.

To add a section, add an entry to `src/lib/admin/sections.ts` (it feeds the sidebar and the overview) and a page under `src/app/admin/(panel)/` that starts with `await requireAdmin()`.

## Project layout

```
src/
  app/                  routes: landing, /privacidad, /terminos, /admin, API handlers
  components/
    admin/              panel shell, navigation, formatting helpers
    brand/              logo, nav, footer
    landing/            one file per landing section
    signin/             sign-in card and one component per step
    panel/              member panel: shell, totals, incident card
    expediente/         expediente page: one component per screen, autosave field, API client
    legal/              shared layout for legal pages
    ui/                 icons and buttons
  lib/                  server helpers: env, db, members, otp, whatsapp, rate limit
  lib/admin/            Google OAuth, admin session, guard, panel sections and queries
prisma/                 schema and migrations
scripts/generate-og.mjs builds src/app/opengraph-image.jpg (link preview image)
```

## Before production

- `src/lib/rate-limit.ts` keeps counters in memory. Use a shared store when running more than one instance.
- Set `NEXT_PUBLIC_SITE_URL` to the public domain. On Vercel it falls back to the production domain, so link previews always get an absolute image URL.
- On Vercel, set every variable from `.env.example`. The `vercel-build` script applies pending migrations before building.

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

## Credits

Photos from Wikimedia Commons; authors and licenses are listed in the site footer.
