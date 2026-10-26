import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
    try {
        const { userId } = await auth()
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // select('*') so this works whether or not the velocity migration's
        // subscription columns exist yet.
        const { data: user, error } = await supabaseAdmin
            .from('users')
            .select('*')
            .eq('clerk_user_id', userId)
            .maybeSingle()

        if (error) throw error

        return NextResponse.json({
            plan: user?.plan || 'free',
            email_notifications: user?.email_notifications ?? false,
            subscription_status: user?.subscription_status ?? null,
            current_period_end: user?.current_period_end ?? null,
            has_billing_account: Boolean(user?.stripe_customer_id),
        })

    } catch (error: unknown) {
        console.error('Fetch settings error:', error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Internal Server Error' },
            { status: 500 }
        )
    }
}
