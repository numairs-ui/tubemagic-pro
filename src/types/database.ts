// Row shapes for the Supabase tables this app reads and writes.
// Columns marked optional may be absent on databases that predate a migration.

export type Plan = 'free' | 'pro' | 'agency'

export interface UserRow {
    id: string
    clerk_user_id: string
    email: string
    plan: Plan | null
    stripe_customer_id: string | null
    stripe_subscription_id: string | null
    email_notifications: boolean | null
    subscription_status?: string | null
    current_period_end?: string | null
}

export interface ChannelRow {
    id: string
    user_id: string
    youtube_channel_id: string
    channel_name: string
    channel_url: string
    niche: string | null
    subscriber_count: number | null
    total_views: number | null
    total_videos: number | null
    thumbnail_url: string | null
    last_synced_at: string | null
}

export interface VideoRow {
    id: string
    channel_id: string
    youtube_video_id: string
    title: string
    description: string | null
    published_at: string
    view_count: number | null
    like_count: number | null
    comment_count: number | null
    duration: number | null
    tags: string[] | null
    thumbnail_url: string | null
    fetched_at: string | null
}

export interface VideoSnapshotRow {
    youtube_video_id: string
    view_count: number
    captured_at: string
}

export interface VisionEvaluationRow {
    id: string
    cache_key: string
    clerk_user_id: string | null
    source: 'public' | 'dashboard'
    title: string
    niche: string | null
    image_bytes: number | null
    result: unknown
    created_at: string
}
