import { NextResponse } from 'next/server'
import { z } from 'zod'
import { ApiError, errorResponse, parseBody, requireUserId } from '@/lib/api'
import { getOwnedChannel } from '@/lib/account'
import { syncChannelVideos } from '@/lib/channel-sync'

export const maxDuration = 60

const bodySchema = z.object({ channelId: z.string().uuid().optional() })

// Minimum gap between syncs. Each sync costs ~2 YouTube quota units and adds one
// snapshot per video; more frequent snapshots add noise, not signal.
const MIN_SYNC_INTERVAL_MS = 6 * 60 * 60 * 1000

export async function POST(req: Request) {
    try {
        const userId = await requireUserId()
        const { channelId } = await parseBody(req, bodySchema)
        const channel = await getOwnedChannel(userId, channelId)

        const lastSynced = channel.last_synced_at ? new Date(channel.last_synced_at).getTime() : 0
        const nextAllowed = lastSynced + MIN_SYNC_INTERVAL_MS
        if (Date.now() < nextAllowed) {
            const minutes = Math.ceil((nextAllowed - Date.now()) / 60000)
            throw new ApiError(429, 'sync_throttled', `Synced recently. Fresh stats are available again in ${minutes} min.`, {
                'Retry-After': String(minutes * 60),
            })
        }

        const { synced } = await syncChannelVideos(channel.id, channel.youtube_channel_id)
        return NextResponse.json({ success: true, synced })
    } catch (error) {
        return errorResponse(error, 'channels/sync')
    }
}
