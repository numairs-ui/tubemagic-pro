import { NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabase'
import { getChannelData, extractChannelIdOrHandle } from '@/lib/youtube'
import { ApiError, errorResponse, parseBody, requireUserId } from '@/lib/api'
import { getOwnedChannel } from '@/lib/account'
import { enforceRateLimit } from '@/lib/rate-limit'

const bodySchema = z.object({
    channelId: z.string().uuid('Channel ID is required'),
    competitorInput: z.string().trim().min(2, 'Competitor URL or @handle is required').max(200),
})

export async function POST(req: Request) {
    try {
        const userId = await requireUserId()
        await enforceRateLimit(`competitor-add:${userId}`, 20, 60 * 60)
        const { channelId, competitorInput } = await parseBody(req, bodySchema)

        // Only the channel's owner may attach competitors to it.
        const channel = await getOwnedChannel(userId, channelId)

        // 1. Resolve competitor handle/URL
        const identifier = extractChannelIdOrHandle(competitorInput)
        const competitorData = await getChannelData(identifier)

        if (competitorData.id === channel.youtube_channel_id) {
            throw new ApiError(400, 'self_competitor', 'You cannot track your own channel as a competitor.')
        }

        // 2. Save competitor to Supabase
        const { data: competitor, error: competitorError } = await supabaseAdmin
            .from('competitors')
            .insert({
                channel_id: channel.id,
                competitor_channel_id: competitorData.id,
                competitor_name: competitorData.name,
            })
            .select()
            .single()

        if (competitorError) {
            if (competitorError.code === '23505') {
                throw new ApiError(400, 'duplicate_competitor', 'This channel is already being tracked as a competitor.')
            }
            throw competitorError
        }

        return NextResponse.json({
            success: true,
            message: 'Competitor added successfully.',
            competitor
        })

    } catch (error: unknown) {
        return errorResponse(error, 'competitors/add')
    }
}
