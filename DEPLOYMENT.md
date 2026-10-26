# Deployment Guide

Production stack: **Vercel** (Next.js 16) · **Supabase** (Postgres) · **Clerk** (auth) · **Stripe** (billing) · **OpenAI** · **YouTube Data API v3**.

## 1. Database (Supabase)

Run these files **in order** in the Supabase SQL Editor of the target project. Every file is idempotent and additive: none drops or alters existing columns or rows.

| # | File | Creates |
|---|------|---------|
| 0 | `base_schema_migration.sql` | `users`, `channels`, `videos` (only if missing; a no-op on existing projects) |
| 1 | `supabase_migration.sql` | `competitors`, `video_ideas`, `optimizations` |
| 2 | `settings_migration.sql` | billing + notification columns on `users` |
| 3 | `velocity_suite_migration.sql` | cache, quota ledger, rate limits, token ledger, vision evaluations, grader leads, stats snapshots, Stripe idempotency |

> `settings_migration.sql` ends with a `CREATE POLICY` that has no `IF NOT EXISTS` guard. If you re-run it and see *policy already exists*, that error is harmless and the columns above it were still applied.

**Verify** (read-only: checks every table, column and function without reading any rows):

```bash
node --env-file=.env.local scripts/verify-db.mjs
```

Exit 0 means everything is in place. Exit 1 lists the missing pieces and which file adds them. Exit 2 means Supabase is unreachable (wrong URL, network, or a paused/deleted project).

**Housekeeping (recommended):** enable the `pg_cron` extension and schedule the cleanup daily:

```sql
select cron.schedule('purge-velocity', '15 3 * * *', $$select purge_expired_velocity_data()$$);
```

The app runs without the velocity migration; it degrades gracefully. Caching, quota metering and rate limits fall back to per-instance memory, and evaluation history and decay detection are unavailable. Apply it before launch.

## 2. Environment variables (Vercel)

Copy every key from [`.env.example`](.env.example) into **Vercel → Project → Settings → Environment Variables** (Production). Use **live** Clerk/Stripe keys in Production and **test** keys in Preview.

| Variable | Where to get it |
|---|---|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY` | Clerk → API Keys (production instance) |
| `CLERK_WEBHOOK_SECRET` | Clerk → Webhooks (step 4) |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API |
| `YOUTUBE_API_KEY` | Google Cloud Console → Credentials (restrict to YouTube Data API v3) |
| `OPENAI_API_KEY` | platform.openai.com |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_SECRET_KEY` | Stripe → Developers → API keys |
| `STRIPE_WEBHOOK_SECRET` | Step 3 below |
| `STRIPE_PRO_PRICE_ID` | Stripe → Product catalog → Pro → Price ID |
| `NEXT_PUBLIC_URL` | `https://your-domain.com` |
| `IP_HASH_SALT` | Any long random string |

Optional tuning knobs (quota budget, model names, grader caps, trial days) are documented inline in `.env.example`.

**Vercel settings:** Framework *Next.js*, build `npm run build`. Routes that call vision or ingest videos declare `maxDuration = 60`; keep **Fluid Compute** enabled (the default) so `after()` can finish background video ingestion.

## 3. Stripe

1. **Developers → Webhooks → Add endpoint**: `https://your-domain.com/api/webhooks/stripe`
2. Subscribe to:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
3. Copy the signing secret into `STRIPE_WEBHOOK_SECRET`.
4. **Settings → Billing → Customer portal**: enable it (the *Manage billing* button uses it).
5. Optional Agency tier: create a second price and set metadata `plan=agency` on it. Subscriptions default to Pro.

### Testing the lifecycle in test mode

```bash
# Terminal 1
npm run dev

# Terminal 2: forward Stripe test events to your machine (prints a whsec_ secret; put it in .env.local)
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Terminal 3: signature + idempotency smoke test (refuses to run with sk_live keys)
node --env-file=.env.local scripts/stripe-webhook-smoke.mjs

# Full lifecycle: upgrade in the app with card 4242 4242 4242 4242, then:
stripe trigger customer.subscription.updated
stripe trigger invoice.payment_failed
stripe subscriptions cancel sub_xxx   # -> customer.subscription.deleted -> plan reverts to free
```

Expected state in `users` after each step:

| Event | `plan` | `subscription_status` |
|---|---|---|
| checkout completed | `pro` | `active` (or `trialing`) |
| payment fails, retrying | `pro` | `past_due` (access kept during Stripe's retry window) |
| canceled / unpaid | `free` | `canceled` / `unpaid` |

Duplicate deliveries are ignored via the `stripe_events` table. If a handler fails, its event row is released so Stripe's retry reprocesses it.

## 4. Clerk

1. **Webhooks → Add endpoint**: `https://your-domain.com/api/webhooks/clerk`, event `user.created`.
2. Copy the signing secret into `CLERK_WEBHOOK_SECRET`.
3. Add your production domain under **Domains**.

## 5. Pre-flight checks

```bash
npm ci
npm run typecheck
npm run lint
npm test          # unit tests: velocity model, URL parsing, SSRF guard, image compression
npm run build
```

After deploy:

- [ ] `node --env-file=.env.production.local scripts/verify-db.mjs` passes against production
- [ ] Landing page loads; the free grader returns a score for a public YouTube link
- [ ] Sign up → connect a channel → videos appear within a minute
- [ ] Velocity Audit and Video Revival render charts
- [ ] Upgrade with a Stripe test card in Preview, and the plan flips to Pro
- [ ] `/api/public/grade` returns HTTP 429 after the per-IP daily limit
