import { currentUser } from '@clerk/nextjs/server'
import { NextResponse, after } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabase'
import { getChannelData, extractChannelIdOrHandle } from '@/lib/youtube'
import { ApiError, errorResponse, parseBody, requireUserId } from '@/lib/api'
import { enforceRateLimit } from '@/lib/rate-limit'
import { syncChannelVideos } from '@/lib/channel-sync'

export const maxDuration = 60

const bodySchema = z.object({
    channelId: z.string().trim().min(2, 'Channel ID, handle, or URL is required').max(200),
})

export async function POST(req: Request) {
    try {
        const userId = await requireUserId()
        const userDetails = await currentUser()
        if (!userDetails) throw new ApiError(401, 'unauthorized', 'Unauthorized')

        await enforceRateLimit(`connect:${userId}`, 10, 60 * 60, 'Too many connection attempts. Try again in an hour.')
        const { channelId: rawInput } = await parseBody(req, bodySchema)

        // 1. Resolve handle/URL to a format getChannelData can use
        const identifier = extractChannelIdOrHandle(rawInput)
        const channelData = await getChannelData(identifier)

        // 2. Ensure user exists in Supabase (Fail-safe for missed webhooks)
        const email = userDetails.emailAddresses[0]?.emailAddress

        const { data: user, error: userError } = await supabaseAdmin
            .from('users')
            .upsert({
                clerk_user_id: userId,
                email: email,
                updated_at: new Date().toISOString()
            }, { onConflict: 'clerk_user_id' })
            .select('id')
            .single()

        if (userError || !user) {
            console.error('Supabase user error:', userError)
            throw new ApiError(500, 'user_sync_failed', 'Failed to sync user with database.')
        }

        // A channel already connected by a different account must not be taken over.
        const { data: existing } = await supabaseAdmin
            .from('channels')
            .select('user_id')
            .eq('youtube_channel_id', channelData.id)
            .maybeSingle()
        if (existing && existing.user_id !== user.id) {
            throw new ApiError(409, 'channel_taken', 'This channel is already connected to another account.')
        }

        // 3. Save channel to Supabase
        const { data: channel, error: channelError } = await supabaseAdmin
            .from('channels')
            .upsert({
                user_id: user.id,
                youtube_channel_id: channelData.id,
                channel_name: channelData.name,
                channel_url: `https://youtube.com/channel/${channelData.id}`,
                subscriber_count: channelData.subscriberCount,
                total_views: channelData.viewCount,
                total_videos: channelData.videoCount,
                thumbnail_url: channelData.thumbnailUrl,
                last_synced_at: new Date().toISOString(),
            }, { onConflict: 'youtube_channel_id' })
            .select()
            .single()

        if (channelError) throw channelError

        // 4. Ingest videos after the response is sent. `after` keeps the
        // serverless function alive until the work finishes.
        after(async () => {
            try {
                const { synced } = await syncChannelVideos(channel.id, channelData.id)
                console.log(`Ingested ${synced} videos for channel ${channelData.id}`)
            } catch (err) {
                console.error(`Error ingesting videos for ${channelData.id}:`, err)
            }
        })

        return NextResponse.json({
            success: true,
            message: 'Channel connected successfully. Video ingestion started.',
            channel
        })

    } catch (error: unknown) {
        return errorResponse(error, 'channels/connect')
    }
}
