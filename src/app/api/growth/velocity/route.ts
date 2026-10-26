import { NextResponse } from 'next/server'
import { errorResponse, requireUserId } from '@/lib/api'
import { getOwnedChannel } from '@/lib/account'
import { getChannelVelocity } from '@/lib/channel-sync'

/** Channel velocity metrics + decaying/underperforming revival candidates. */
export async function GET(req: Request) {
    try {
        const userId = await requireUserId()
        const channelId = new URL(req.url).searchParams.get('channelId')
        const channel = await getOwnedChannel(userId, channelId)

        const { velocity } = await getChannelVelocity(channel)

        return NextResponse.json({
            channel: {
                id: channel.id,
                name: channel.channel_name,
                niche: channel.niche,
                last_synced_at: channel.last_synced_at,
            },
            velocity,
        })
    } catch (error) {
        return errorResponse(error, 'growth/velocity')
    }
}
