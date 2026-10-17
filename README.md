# Condorin

Condorin monitors illegal gold mining in the Peruvian Amazon (river dredges and open-pit mines) from satellite imagery and alerts people by WhatsApp.

This repository is the public site: a landing page where people sign in with their WhatsApp number.

## Stack

- Next.js 16 (App Router) with TypeScript and React 19
- Tailwind CSS 4
- Prisma 7 on Neon Postgres
- WhatsApp Cloud API for one-time sign-in codes

## Getting started

```bash
npm install
cp .env.example .env.local   # then fill in the values
npm run db:migrate           # creates the tables
npm run dev
```

Open http://localhost:3000.

## How sign-in works

1. `POST /api/otp/send` checks consent, normalizes the number and sends a 6-digit code using a WhatsApp **authentication** template.
2. The code is never stored. The browser gets an httpOnly cookie holding only an HMAC of the phone, the expiry and the code.
3. `POST /api/otp/verify` recomputes the HMAC and, on match, records the member in Postgres and sets a signed session cookie (30 days).

Limits: one code per number every 45 seconds, 5 attempts per code, 10-minute expiry.

## Project layout

```
src/
  app/                  routes: landing, /privacidad, /terminos, API handlers
  components/
    brand/              logo, nav, footer
    landing/            one file per landing section
    signin/             sign-in card and one component per step
    legal/              shared layout for legal pages
    ui/                 icons and buttons
  lib/                  server helpers: env, db, members, otp, whatsapp, rate limit
prisma/                 schema and migrations
scripts/generate-og.mjs builds public/og.jpg (link preview image)
```

## Before production

- `src/lib/rate-limit.ts` keeps counters in memory. Use a shared store when running more than one instance.
- Set `NEXT_PUBLIC_SITE_URL` so link previews use absolute URLs.
- On Vercel, set every variable from `.env.example`. The `vercel-build` script applies pending migrations before building.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript without emitting |
| `npm run db:migrate` | Create and apply a migration in development |
| `npm run db:deploy` | Apply pending migrations in production |
| `npm run og` | Regenerate the link preview image |

## Credits

Photos from Wikimedia Commons; authors and licenses are listed in the site footer.
