import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not defined in .env.local')
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2026-01-28.clover', // Correct version for types
    appInfo: {
        name: 'YouTube SEO Tool',
        version: '0.1.0',
    },
})
