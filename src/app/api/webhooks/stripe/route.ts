import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { stripe } from '@/lib/stripe'
import { supabaseAdmin } from '@/lib/supabase'
import { normalizePlan } from '@/lib/account'
import Stripe from 'stripe'

/**
 * Stripe subscription lifecycle.
 *
 * Subscribe in the Stripe dashboard to:
 *   checkout.session.completed, customer.subscription.created,
 *   customer.subscription.updated, customer.subscription.deleted,
 *   invoice.payment_failed
 *
 * Events are de-duplicated through `stripe_events`, because Stripe retries
 * deliveries and may send the same event more than once.
 */

// Statuses that keep paid access. `past_due` keeps access during Stripe's
// smart-retry window; `unpaid`/`canceled`/`incomplete_expired` revoke it.
const ACTIVE_STATUSES: Stripe.Subscription.Status[] = ['active', 'trialing', 'past_due']

function planForSubscription(subscription: Stripe.Subscription) {
    if (!ACTIVE_STATUSES.includes(subscription.status)) return 'free'
    // Price/product metadata `plan=agency` selects the Agency tier; default Pro.
    const item = subscription.items.data[0]
    const metadataPlan = item?.price?.metadata?.plan || subscription.metadata?.plan
    return metadataPlan ? normalizePlan(metadataPlan) : 'pro'
}

function periodEnd(subscription: Stripe.Subscription): string | null {
    // API 2025+ moved current_period_end onto subscription items.
    const end = subscription.items.data[0]?.current_period_end
    return end ? new Date(end * 1000).toISOString() : null
}

async function applySubscription(subscription: Stripe.Subscription, clerkUserId?: string | null) {
    const update = {
        plan: planForSubscription(subscription),
        stripe_subscription_id: subscription.status === 'canceled' ? null : subscription.id,
        subscription_status: subscription.status,
        current_period_end: periodEnd(subscription),
    }

    const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id
    const query = supabaseAdmin.from('users').update(update)
    const { error } = clerkUserId
        ? await query.eq('clerk_user_id', clerkUserId)
        : await query.eq('stripe_customer_id', customerId)

    if (error) {
        // Databases without the velocity migration lack the two new columns;
        // still apply the plan change the app depends on.
        console.warn('Full subscription update failed, retrying plan-only:', error.message)
        const fallback = supabaseAdmin.from('users').update({
            plan: update.plan,
            stripe_subscription_id: update.stripe_subscription_id,
        })
        const { error: fallbackError } = clerkUserId
            ? await fallback.eq('clerk_user_id', clerkUserId)
            : await fallback.eq('stripe_customer_id', customerId)
        if (fallbackError) throw fallbackError
    }
}

/** Returns true if this event id was already processed. */
async function alreadyProcessed(event: Stripe.Event): Promise<boolean> {
    const { error } = await supabaseAdmin.from('stripe_events').insert({ id: event.id, type: event.type })
    if (!error) return false
    if (error.code === '23505') return true // unique violation: duplicate delivery
    console.warn('stripe_events unavailable, processing without idempotency guard:', error.message)
    return false
}

async function releaseEvent(eventId: string) {
    // Let Stripe's retry reprocess an event whose handler failed.
    await supabaseAdmin.from('stripe_events').delete().eq('id', eventId)
}

export async function POST(req: Request) {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
    if (!webhookSecret) {
        console.error('STRIPE_WEBHOOK_SECRET is not configured')
        return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 })
    }

    const body = await req.text()
    const signature = (await headers()).get('stripe-signature')
    if (!signature) {
        return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
    }

    let event: Stripe.Event

    try {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown error'
        console.error(`Webhook signature verification failed: ${message}`)
        return NextResponse.json({ error: `Webhook Error: ${message}` }, { status: 400 })
    }

    if (await alreadyProcessed(event)) {
        return NextResponse.json({ received: true, duplicate: true }, { status: 200 })
    }

    try {
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object as Stripe.Checkout.Session
                if (session.mode !== 'subscription' || !session.subscription) break

                const subscriptionId = typeof session.subscription === 'string' ? session.subscription : session.subscription.id
                const subscription = await stripe.subscriptions.retrieve(subscriptionId)
                await applySubscription(subscription, session.metadata?.clerkUserId)
                break
            }

            case 'customer.subscription.created':
            case 'customer.subscription.updated':
            case 'customer.subscription.deleted': {
                const subscription = event.data.object as Stripe.Subscription
                await applySubscription(subscription, subscription.metadata?.clerkUserId)
                break
            }

            case 'invoice.payment_failed': {
                const invoice = event.data.object as Stripe.Invoice
                // Access is governed by the subscription status events above; this
                // is logged so failed renewals are visible in Vercel logs.
                console.warn(`Payment failed for customer ${invoice.customer} (invoice ${invoice.id})`)
                break
            }

            default:
                console.log(`Unhandled event type: ${event.type}`)
        }
    } catch (error) {
        console.error(`Error handling Stripe event ${event.type} (${event.id}):`, error)
        await releaseEvent(event.id)
        return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
    }

    return NextResponse.json({ received: true }, { status: 200 })
}
