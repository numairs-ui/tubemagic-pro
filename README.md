# TubeMagic Velocity

**The High-CTR Creator Copilot & Packaging Suite.** Win the click before you hit publish.

TubeMagic Velocity helps YouTube creators with the one lever that multiplies every video: **packaging**, meaning the thumbnail and title a viewer sees for half a second in their feed.

| Workflow | What it does |
|---|---|
| **Packaging Studio** (CTR Vision) | GPT-4o Vision grades thumbnail + title *together* on 5 dimensions, previews them in a real mobile feed (light/dark), and suggests titles that pair better with the image. |
| **Repurposing Studio** | Turns one long-form video into a Shorts script, TikTok hooks, a Community poll and an X thread. |
| **Video Revival** | Models how views normally grow on *your* channel, flags older videos that are decaying or underperforming for their age, and drafts a repackage to restart traffic. |
| **Channel Velocity Audit** | 10 health checks plus momentum, cadence and a per-video chart against your own baseline. |
| **Free CTR Grader** (`/`, `/grader`) | Public, no-signup lead magnet. Instant score + top fix; full report unlocked by email. |

Supporting tools: competitor topic gaps, keyword research, title/SEO optimizer, rank tracker.

---

## Quick start

```bash
cp .env.example .env.local     # fill in keys (see DEPLOYMENT.md)
npm install
npm run dev                    # http://localhost:3000
```

Database setup, Stripe and Clerk configuration, and the production checklist are in **[DEPLOYMENT.md](DEPLOYMENT.md)**.

| Script | Purpose |
|---|---|
| `npm run dev` / `build` / `start` | Next.js |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm test` | Node test runner: velocity model, URL parsing, SSRF guard, image compression |
| `node --env-file=.env.local scripts/verify-db.mjs` | Read-only check that all migrations are applied |
| `node --env-file=.env.local scripts/stripe-webhook-smoke.mjs` | Webhook signature + idempotency smoke test (test keys only) |

---

## Architecture

```
Browser ──► Next.js App Router (Vercel)
              │
              ├─ src/app/api/*          Route handlers: zod validation → rate limit → budget → work
              │     └─ src/lib/api.ts   ApiError + errorResponse: consistent {error, code} JSON, no leaked internals
              │
              ├─ src/lib/youtube.ts     ALL YouTube calls: Supabase cache + daily quota ledger
              ├─ src/lib/ai.ts          ALL OpenAI calls: token budgets, output caps, schema-validated JSON
              ├─ src/lib/ctr-grader.ts  load → compress → cache lookup → GPT-4o Vision → persist
              ├─ src/lib/velocity.ts    Pure analytics: age curve, momentum, decay, audit (unit-tested)
              └─ src/lib/channel-sync.ts Ingest uploads + append stats snapshots
                         │
                         ▼
                    Supabase Postgres (service-role only; RLS on, no public policies on new tables)
```

### Cost and quota guardrails

**YouTube Data API (10,000 units/day).**
- Every call is cached in `api_cache` (channels 6h, uploads 1h, searches 24h, competitor top videos 24h).
- Every uncached call reserves units atomically via `try_consume_youtube_quota()`. New calls are refused at `YOUTUBE_DAILY_QUOTA_BUDGET` (default 9,000), leaving headroom.
- Ingestion uses the uploads playlist plus a batched `videos.list`: **2 units per 50 videos** (was ~150 with `search.list` + one call per video). Topic-gap scans dropped from 100 to 2 units per competitor the same way.
- `search.list` (100 units) is used only for channel search and keyword research, both cached and rate-limited per plan.

**OpenAI.**
- Thumbnails are compressed with `sharp` to WebP before Vision: 768×432 for the dashboard (~425 image tokens at `detail: high`, vs ~1,105 for a raw 1280×720) and 512×288 at `detail: low` for the public grader (flat 85 tokens). Browsers pre-shrink uploads to ≤1280px so requests stay small.
- Identical image + title + niche gradings are served from `vision_evaluations` for 30 days at zero tokens.
- Per-user rolling 24h token budgets by plan, a global ceiling (`OPENAI_GLOBAL_DAILY_TOKEN_BUDGET`), per-call `max_completion_tokens`, and transcript truncation (12k chars).
- Usage is recorded per call in `ai_usage` for cost reporting.

**Abuse protection.** Fixed-window rate limits shared across instances (`consume_rate_limit()`), per-IP plus global caps on the public grader, SSRF-safe image fetching (public HTTPS hosts only, every redirect re-validated, 8 MB cap), salted IP hashing, and prompt-injection framing (user text is passed as quoted data).

**Graceful degradation.** If the velocity migration isn't applied yet, the cache, quota and rate limits fall back to per-instance memory and the app keeps working.

### Plan limits (`src/lib/account.ts`)

| | Free | Pro | Agency |
|---|---|---|---|
| CTR grades / day | 5 | 100 | 400 |
| AI runs / hour | 15 | 120 | 400 |
| Tokens / 24h | 40k | 400k | 1.5M |
| Channel searches / hour | 5 | 30 | 100 |

---

## Positioning playbook

**Category:** creator copilot for *packaging*, not another "YouTube SEO tool". SEO tools compete on keyword volume estimates nobody trusts; packaging is where creators feel the pain every single upload.

**One-liner:** *Win the click before you hit publish.*

**Who it's for:** creators publishing weekly with 1k–500k subscribers who make their own thumbnails or brief a designer. They already know packaging matters; they lack a fast, honest second opinion.

**Why we win:**
1. **We grade the pair, not the parts.** Thumbnail and title are scored together, in a real mobile feed, the way viewers decide.
2. **Honest scoring.** We say plainly that the score is relative packaging strength, *not* a CTR prediction. That candour is a trust wedge against tools that promise "predicted CTR: 14.2%".
3. **Your channel is the baseline.** Revival and the audit compare each video with *your* age-adjusted curve, not a generic benchmark.
4. **Closes the loop.** Grade → publish → repurpose → revive is one workflow, not four tools.

**Acquisition engine: the free grader.**
- Zero-friction (no signup, paste any YouTube link: yours or a competitor's), with an instant score and #1 fix.
- The full report unlocks by email (`grader_leads`); the CTA converts to signup ("grade before every upload").
- Shareable standalone URL: `/grader`. Use it in creator communities, Reddit/Discord threads, and "I graded the top 10 thumbnails in [niche]" content.

**Messaging do's and don'ts:**
- ✅ "See your thumbnail the way viewers do." "Fix it before you publish." "Your channel's own baseline."
- ❌ Guaranteed CTR numbers, "viral", fabricated benchmarks or testimonials. Every metric in the product is computed from real data.

---

## Launch checklist

**Product**
- [ ] Run all four migrations in production; `scripts/verify-db.mjs` passes
- [ ] Grade 10 real thumbnails across niches and sanity-check score calibration (most should land 40–75)
- [ ] Connect a real channel and confirm ingestion, the audit chart and revival candidates
- [ ] Schedule `purge_expired_velocity_data()` daily
- [ ] Write the Terms and Privacy pages (footer links are placeholders). Mention email capture and IP hashing.

**Billing**
- [ ] Live Stripe price set in `STRIPE_PRO_PRICE_ID`, webhook endpoint subscribed to all 5 events, customer portal enabled
- [ ] End-to-end upgrade → cancel in Preview with test keys (see DEPLOYMENT.md §3)

**Cost controls**
- [ ] Set an OpenAI monthly usage limit in the OpenAI dashboard as a final backstop
- [ ] Restrict the YouTube API key to the YouTube Data API and your server
- [ ] Review `ai_usage` and `youtube_quota_usage` after the first 48 hours; tune `PUBLIC_GRADER_*` caps

**Go-to-market**
- [ ] Publish `/grader` and share it in 3–5 creator communities with a genuine "roast my thumbnail" angle
- [ ] Export `grader_leads` weekly into your email tool; send a 3-email packaging tips sequence ending with the Pro offer
- [ ] Track funnel: grader runs → email unlocks → signups → channel connects → Pro upgrades
