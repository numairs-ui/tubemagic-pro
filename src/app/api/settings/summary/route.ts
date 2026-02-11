import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
    try {
        const { userId } = await auth()
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { data: user, error } = await supabaseAdmin
            .from('users')
            .select('plan, email_notifications')
            .eq('clerk_user_id', userId)
            .single()

        if (error) throw error

        return NextResponse.json(user)

    } catch (error: unknown) {
        console.error('Fetch settings error:', error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Internal Server Error' },
            { status: 500 }
        )
    }
}
