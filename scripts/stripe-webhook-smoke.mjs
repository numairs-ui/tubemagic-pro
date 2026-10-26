// Smoke test for /api/webhooks/stripe signature handling and idempotency.
// Uses only TEST-mode keys; never point this at production.
//
//   npm run dev   (or: npx next start)
//   node --env-file=.env.local scripts/stripe-webhook-smoke.mjs [baseUrl]
//
// It posts a synthetic event of a type the handler ignores (so no user rows are
// touched): first unsigned, then with a bad signature, then correctly signed twice.
// For the full subscription lifecycle use the Stripe CLI (see DEPLOYMENT.md).
import Stripe from 'stripe'

const base = process.argv[2] || 'http://localhost:3000'
const secret = process.env.STRIPE_WEBHOOK_SECRET
const key = process.env.STRIPE_SECRET_KEY || ''

if (!secret) {
    console.error('STRIPE_WEBHOOK_SECRET is not set')
    process.exit(1)
}
if (key.startsWith('sk_live_')) {
    console.error('Refusing to run with a live Stripe key. Use test-mode keys.')
    process.exit(1)
}

const stripe = new Stripe(key || 'sk_test_placeholder')
const payload = JSON.stringify({
    id: `evt_smoke_${Date.now()}`,
    object: 'event',
    type: 'smoke.test',
    data: { object: {} },
})

async function post(label, headers, expected) {
    const res = await fetch(`${base}/api/webhooks/stripe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: payload,
    })
    const body = await res.text()
    const ok = res.status === expected
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}: HTTP ${res.status} (expected ${expected}) ${body}`)
    return ok
}

const signed = stripe.webhooks.generateTestHeaderString({ payload, secret })
const results = [
    await post('missing signature', {}, 400),
    await post('bad signature', { 'stripe-signature': 't=1,v1=deadbeef' }, 400),
    await post('valid signature', { 'stripe-signature': signed }, 200),
    await post('duplicate delivery', { 'stripe-signature': signed }, 200),
]

process.exit(results.every(Boolean) ? 0 : 1)
