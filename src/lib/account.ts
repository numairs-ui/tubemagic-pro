import { supabaseAdmin } from '@/lib/supabase'
import { ApiError } from '@/lib/api'
import type { ChannelRow, Plan, UserRow } from '@/types/database'

/**
 * Per-plan guardrails. `dailyTokens` is a rolling 24h OpenAI token budget;
 * the other limits are request counts per window.
 */
export const PLAN_LIMITS: Record<Plan, {
    dailyTokens: number
    visionPerDay: number
    aiPerHour: number
    channelSearchesPerHour: number
}> = {
    free: { dailyTokens: 40_000, visionPerDay: 5, aiPerHour: 15, channelSearchesPerHour: 5 },
    pro: { dailyTokens: 400_000, visionPerDay: 100, aiPerHour: 120, channelSearchesPerHour: 30 },
    agency: { dailyTokens: 1_500_000, visionPerDay: 400, aiPerHour: 400, channelSearchesPerHour: 100 },
}

export function normalizePlan(plan: string | null | undefined): Plan {
    return plan === 'pro' || plan === 'agency' ? plan : 'free'
}

export async function getDbUser(clerkUserId: string): Promise<UserRow | null> {
    const { data } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('clerk_user_id', clerkUserId)
        .maybeSingle()
    return (data as UserRow | null) ?? null
}

export async function getUserPlan(clerkUserId: string): Promise<Plan> {
    const user = await getDbUser(clerkUserId)
    return normalizePlan(user?.plan)
}

export async function getUserChannels(clerkUserId: string): Promise<ChannelRow[]> {
    const user = await getDbUser(clerkUserId)
    if (!user) return []
    const { data } = await supabaseAdmin
        .from('channels')
        .select('*')
        .eq('user_id', user.id)
        .order('last_synced_at', { ascending: false })
    return (data as ChannelRow[] | null) ?? []
}

/**
 * Resolve a channel the user owns. With no `channelId`, returns their most
 * recently synced channel. Throws 404 rather than leaking another user's data.
 */
export async function getOwnedChannel(clerkUserId: string, channelId?: string | null): Promise<ChannelRow> {
    const channels = await getUserChannels(clerkUserId)
    if (channels.length === 0) {
        throw new ApiError(404, 'no_channel', 'Connect a YouTube channel first.')
    }
    if (!channelId) return channels[0]

    const channel = channels.find((c) => c.id === channelId)
    if (!channel) throw new ApiError(404, 'channel_not_found', 'Channel not found.')
    return channel
}
