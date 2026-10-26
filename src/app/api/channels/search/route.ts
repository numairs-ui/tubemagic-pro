import { NextResponse } from 'next/server'
import { searchChannels } from '@/lib/youtube'
import { ApiError, errorResponse, requireUserId } from '@/lib/api'
import { enforceRateLimit } from '@/lib/rate-limit'
import { getUserPlan, PLAN_LIMITS } from '@/lib/account'

export async function GET(req: Request) {
    try {
        const userId = await requireUserId()

        const { searchParams } = new URL(req.url)
        const query = searchParams.get('q')?.trim()
        if (!query) throw new ApiError(400, 'invalid_request', 'Search query is required')
        if (query.length > 100) throw new ApiError(400, 'invalid_request', 'Search query is too long')

        // search.list costs 100 quota units per uncached query.
        const plan = await getUserPlan(userId)
        await enforceRateLimit(
            `channel-search:${userId}`,
            PLAN_LIMITS[plan].channelSearchesPerHour,
            60 * 60,
            'Search limit reached. Paste your channel URL or @handle below instead.'
        )

        const channels = await searchChannels(query)
        return NextResponse.json({ channels })
    } catch (error: unknown) {
        return errorResponse(error, 'channels/search')
    }
}
