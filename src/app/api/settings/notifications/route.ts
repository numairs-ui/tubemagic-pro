import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: Request) {
    try {
        const { userId } = await auth()
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { emailNotifications } = await req.json()

        const { error } = await supabaseAdmin
            .from('users')
            .update({ email_notifications: emailNotifications })
            .eq('clerk_user_id', userId)

        if (error) throw error

        return NextResponse.json({ success: true })

    } catch (error: unknown) {
        console.error('Update settings error:', error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Internal Server Error' },
            { status: 500 }
        )
    }
}
