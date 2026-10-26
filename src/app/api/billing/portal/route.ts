import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { ApiError, errorResponse, requireUserId } from '@/lib/api'
import { getDbUser } from '@/lib/account'

/** Stripe Customer Portal: update card, view invoices, cancel. */
export async function POST() {
    try {
        const userId = await requireUserId()
        const user = await getDbUser(userId)
        if (!user?.stripe_customer_id) {
            throw new ApiError(400, 'no_billing_account', 'No billing account found. Upgrade first.')
        }

        const session = await stripe.billingPortal.sessions.create({
            customer: user.stripe_customer_id,
            return_url: `${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/dashboard/settings`,
        })

        return NextResponse.json({ url: session.url })
    } catch (error) {
        return errorResponse(error, 'billing/portal')
    }
}
