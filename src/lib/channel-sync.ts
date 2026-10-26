import { supabaseAdmin } from '@/lib/supabase'
import { getChannelVideos, getVideosDetails } from '@/lib/youtube'
import { analyzeChannel, type ChannelVelocity } from '@/lib/velocity'
import type { ChannelRow, VideoRow, VideoSnapshotRow } from '@/types/database'

/**
 * Pull the latest uploads + stats for a channel and store them.
 * Costs 2 YouTube quota units for 50 videos (uploads playlist + one batched
 * videos.list), versus ~150 for the previous search + per-video approach.
 * Every sync also appends a stats snapshot per video, which is what lets the
 * Revival workflow detect decay over time.
 */
export async function syncChannelVideos(dbChannelId: string, youtubeChannelId: string, maxVideos = 50) {
    const uploads = await getChannelVideos(youtubeChannelId, maxVideos)
    if (uploads.length === 0) return { synced: 0 }

    // Short stats TTL: a sync should reflect near-current numbers.
    const details = await getVideosDetails(uploads.map((v) => v.videoId), 10 * 60)
    const byId = new Map(details.map((d) => [d.videoId, d]))
    const fetchedAt = new Date().toISOString()

    const rows = uploads.map((video) => {
        const stats = byId.get(video.videoId)
        return {
            channel_id: dbChannelId,
            youtube_video_id: video.videoId,
            title: video.title,
            description: stats?.description || video.description,
            published_at: video.publishedAt,
            view_count: stats?.viewCount ?? 0,
            like_count: stats?.likeCount ?? 0,
            comment_count: stats?.commentCount ?? 0,
            duration: stats?.durationSeconds ?? 0,
            tags: stats?.tags ?? [],
            thumbnail_url: stats?.thumbnailUrl || video.thumbnailUrl,
            fetched_at: fetchedAt,
        }
    })

    const { error: upsertError } = await supabaseAdmin
        .from('videos')
        .upsert(rows, { onConflict: 'youtube_video_id' })
    if (upsertError) throw upsertError

    const { error: snapshotError } = await supabaseAdmin.from('video_stats_snapshots').insert(
        rows.map((r) => ({
            youtube_video_id: r.youtube_video_id,
            view_count: r.view_count,
            like_count: r.like_count,
            comment_count: r.comment_count,
            captured_at: fetchedAt,
        }))
    )
    if (snapshotError) console.warn('[channel-sync] Snapshots not stored (run velocity_suite_migration.sql):', snapshotError.message)

    await supabaseAdmin.from('channels').update({ last_synced_at: fetchedAt }).eq('id', dbChannelId)

    return { synced: rows.length }
}

export async function getChannelVideosFromDb(channelId: string, limit = 50): Promise<VideoRow[]> {
    const { data, error } = await supabaseAdmin
        .from('videos')
        .select('*')
        .eq('channel_id', channelId)
        .order('published_at', { ascending: false })
        .limit(limit)
    if (error) throw error
    return (data as VideoRow[] | null) ?? []
}

async function getSnapshots(youtubeVideoIds: string[]): Promise<VideoSnapshotRow[]> {
    if (youtubeVideoIds.length === 0) return []
    const since = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString()
    const { data, error } = await supabaseAdmin
        .from('video_stats_snapshots')
        .select('youtube_video_id, view_count, captured_at')
        .in('youtube_video_id', youtubeVideoIds)
        .gte('captured_at', since)
        .order('captured_at', { ascending: false })
        .limit(2000)
    if (error) return [] // table not migrated yet: analysis degrades to age-curve only
    return (data as VideoSnapshotRow[] | null) ?? []
}

export async function getChannelVelocity(channel: ChannelRow): Promise<{ videos: VideoRow[]; velocity: ChannelVelocity }> {
    const videos = await getChannelVideosFromDb(channel.id)
    const snapshots = await getSnapshots(videos.map((v) => v.youtube_video_id))
    return { videos, velocity: analyzeChannel(videos, snapshots) }
}
