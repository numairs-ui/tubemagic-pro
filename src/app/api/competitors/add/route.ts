import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getChannelData, extractChannelIdOrHandle } from '@/lib/youtube'

export async function POST(req: Request) {
    try {
        const { userId } = await auth()
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { channelId, competitorInput } = await req.json()
        if (!channelId || !competitorInput) {
            return NextResponse.json({ error: 'Channel ID and Competitor Input are required' }, { status: 400 })
        }

        // 1. Resolve competitor handle/URL
        const identifier = extractChannelIdOrHandle(competitorInput)
        const competitorData = await getChannelData(identifier)

        // 2. Save competitor to Supabase
        const { data: competitor, error: competitorError } = await supabaseAdmin
            .from('competitors')
            .insert({
                channel_id: channelId,
                competitor_channel_id: competitorData.id,
                competitor_name: competitorData.name,
            })
            .select()
            .single()

        if (competitorError) {
            if (competitorError.code === '23505') {
                return NextResponse.json({ error: 'This channel is already being tracked as a competitor.' }, { status: 400 })
            }
            throw competitorError
        }

        return NextResponse.json({
            success: true,
            message: 'Competitor added successfully.',
            competitor
        })

    } catch (error: unknown) {
        console.error('Add competitor error:', error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to add competitor' },
            { status: 500 }
        )
    }
}
