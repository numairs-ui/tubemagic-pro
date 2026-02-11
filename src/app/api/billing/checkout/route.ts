import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST() {
    try {
        const { userId } = await auth()
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // 1. Get user email and current data
        const { data: user } = await supabaseAdmin
            .from('users')
            .select('email, stripe_customer_id')
            .eq('clerk_user_id', userId)
            .single()

        if (!user) throw new Error('User not found in database')

        let stripeCustomerId = user.stripe_customer_id

        // 2. Create Stripe customer if doesn't exist
        if (!stripeCustomerId) {
            const customer = await stripe.customers.create({
                email: user.email,
                metadata: { clerkUserId: userId }
            })
            stripeCustomerId = customer.id

            await supabaseAdmin
                .from('users')
                .update({ stripe_customer_id: stripeCustomerId })
                .eq('clerk_user_id', userId)
        }

        // 3. Create Checkout Session
        // Check if environment variable for price ID exists, otherwise use a placeholder
        const priceId = process.env.STRIPE_PRO_PRICE_ID
        if (!priceId) {
            return NextResponse.json({ error: 'Stripe Price ID not configured.' }, { status: 500 })
        }

        const session = await stripe.checkout.sessions.create({
            customer: stripeCustomerId,
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            mode: 'subscription',
            success_url: `${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/dashboard/settings?success=true`,
            cancel_url: `${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/dashboard/settings?canceled=true`,
            metadata: {
                clerkUserId: userId
            }
        })

        return NextResponse.json({ url: session.url })

    } catch (error: unknown) {
        console.error('Checkout error:', error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Internal Server Error' },
            { status: 500 }
        )
    }
}
