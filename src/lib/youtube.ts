import { google, youtube_v3 } from 'googleapis'
import { cached } from '@/lib/cache'
import { ApiError } from '@/lib/api'
import { supabaseAdmin } from '@/lib/supabase'
import { parseISO8601Duration, uploadsPlaylistId } from '@/lib/youtube-url'

export { extractChannelIdOrHandle, extractVideoId, parseISO8601Duration } from '@/lib/youtube-url'

const youtube = google.youtube({
    version: 'v3',
    auth: process.env.YOUTUBE_API_KEY,
})

/**
 * Every YouTube Data API call in the app goes through this module so that it is
 * (1) cached in Supabase and (2) charged against a shared daily quota ledger.
 *
 * Unit costs (https://developers.google.com/youtube/v3/determine_quota_cost):
 * search.list = 100, channels/videos/playlistItems.list = 1.
 * We refuse new uncached calls once today's spend reaches the budget, keeping a
 * reserve for channel connects and syncs.
 */
const QUOTA_COST = { search: 100, list: 1 } as const
const DAILY_QUOTA_BUDGET = Number(process.env.YOUTUBE_DAILY_QUOTA_BUDGET || 9_000)

const HOUR = 60 * 60
const DAY = 24 * HOUR

let warnedLedgerMissing = false

async function spendQuota(units: number) {
    const { data, error } = await supabaseAdmin.rpc('try_consume_youtube_quota', {
        p_units: units,
        p_budget: DAILY_QUOTA_BUDGET,
    })

    if (error) {
        if (!warnedLedgerMissing) {
            warnedLedgerMissing = true
            console.warn('[youtube] Quota ledger unavailable, calls are not being metered.', error.message)
        }
        return
    }
    if (data === false) {
        throw new ApiError(
            503,
            'youtube_quota_exhausted',
            'Our YouTube data quota for today is used up. Cached data is still available; new lookups resume after midnight Pacific Time.'
        )
    }
}

/** Run a metered YouTube call and translate Google errors into ApiErrors. */
async function callYoutube<T>(units: number, fn: () => Promise<T>): Promise<T> {
    await spendQuota(units)
    try {
        return await fn()
    } catch (error: unknown) {
        const reason = (error as { errors?: { reason?: string }[] })?.errors?.[0]?.reason
        if (reason === 'quotaExceeded' || reason === 'dailyLimitExceeded') {
            throw new ApiError(503, 'youtube_quota_exhausted', 'YouTube API quota exceeded for today. Please try again tomorrow.')
        }
        if (reason === 'playlistNotFound' || reason === 'channelNotFound') {
            throw new ApiError(404, 'youtube_not_found', 'That YouTube channel or playlist could not be found.')
        }
        throw error
    }
}

function bestThumbnail(thumbnails?: youtube_v3.Schema$ThumbnailDetails): string {
    return (
        thumbnails?.maxres?.url ||
        thumbnails?.standard?.url ||
        thumbnails?.high?.url ||
        thumbnails?.medium?.url ||
        thumbnails?.default?.url ||
        ''
    )
}

export interface ChannelData {
    id: string
    name: string
    description: string
    thumbnailUrl: string
    subscriberCount: number
    viewCount: number
    videoCount: number
    uploadsPlaylistId: string
}

export async function getChannelData(identifier: string): Promise<ChannelData> {
    const isHandle = identifier.startsWith('@')
    const { value } = await cached(`yt:channel:${identifier.toLowerCase()}`, 6 * HOUR, async () => {
        const response = await callYoutube(QUOTA_COST.list, () =>
            youtube.channels.list({
                part: ['snippet', 'statistics', 'contentDetails'],
                id: isHandle ? undefined : [identifier],
                forHandle: isHandle ? identifier : undefined,
            })
        )

        const channel = response.data.items?.[0]
        if (!channel) throw new ApiError(404, 'channel_not_found', 'Channel not found. Make sure the ID or @handle is correct.')

        return {
            id: channel.id!,
            name: channel.snippet?.title || 'Untitled channel',
            description: channel.snippet?.description || '',
            thumbnailUrl: bestThumbnail(channel.snippet?.thumbnails),
            subscriberCount: parseInt(channel.statistics?.subscriberCount || '0'),
            viewCount: parseInt(channel.statistics?.viewCount || '0'),
            videoCount: parseInt(channel.statistics?.videoCount || '0'),
            uploadsPlaylistId:
                channel.contentDetails?.relatedPlaylists?.uploads || uploadsPlaylistId(channel.id!),
        }
    })
    return value
}

export async function searchChannels(query: string, maxResults = 5) {
    const { value } = await cached(`yt:search-channels:${query.toLowerCase().trim()}:${maxResults}`, DAY, async () => {
        const response = await callYoutube(QUOTA_COST.search, () =>
            youtube.search.list({
                part: ['snippet'],
                q: query,
                type: ['channel'],
                maxResults,
            })
        )

        return (response.data.items || []).map((item) => ({
            id: item.snippet!.channelId!,
            name: item.snippet?.title || '',
            description: item.snippet?.description || '',
            thumbnailUrl: bestThumbnail(item.snippet?.thumbnails),
        }))
    })
    return value
}

export interface ChannelVideo {
    videoId: string
    title: string
    description: string
    publishedAt: string
    thumbnailUrl: string
}

/**
 * Latest uploads via the channel's uploads playlist (1 unit per 50 videos),
 * instead of search.list (100 units per call).
 */
export async function getChannelVideos(channelId: string, maxResults = 50): Promise<ChannelVideo[]> {
    const playlistId = uploadsPlaylistId(channelId)
    const { value } = await cached(`yt:uploads:${playlistId}:${maxResults}`, HOUR, async () => {
        const videos: ChannelVideo[] = []
        let pageToken: string | undefined

        while (videos.length < maxResults) {
            const response = await callYoutube(QUOTA_COST.list, () =>
                youtube.playlistItems.list({
                    part: ['snippet', 'contentDetails'],
                    playlistId,
                    maxResults: Math.min(50, maxResults - videos.length),
                    pageToken,
                })
            )

            for (const item of response.data.items || []) {
                const videoId = item.contentDetails?.videoId
                if (!videoId) continue
                videos.push({
                    videoId,
                    title: item.snippet?.title || '',
                    description: item.snippet?.description || '',
                    publishedAt: item.contentDetails?.videoPublishedAt || item.snippet?.publishedAt || new Date().toISOString(),
                    thumbnailUrl: bestThumbnail(item.snippet?.thumbnails),
                })
            }

            pageToken = response.data.nextPageToken || undefined
            if (!pageToken) break
        }
        return videos
    })
    return value
}

export interface VideoDetails {
    videoId: string
    title: string
    description: string
    channelTitle: string
    publishedAt: string
    thumbnailUrl: string
    viewCount: number
    likeCount: number
    commentCount: number
    durationSeconds: number
    tags: string[]
}

function toVideoDetails(video: youtube_v3.Schema$Video): VideoDetails {
    return {
        videoId: video.id!,
        title: video.snippet?.title || '',
        description: video.snippet?.description || '',
        channelTitle: video.snippet?.channelTitle || '',
        publishedAt: video.snippet?.publishedAt || '',
        thumbnailUrl: bestThumbnail(video.snippet?.thumbnails),
        viewCount: parseInt(video.statistics?.viewCount || '0'),
        likeCount: parseInt(video.statistics?.likeCount || '0'),
        commentCount: parseInt(video.statistics?.commentCount || '0'),
        durationSeconds: parseISO8601Duration(video.contentDetails?.duration || ''),
        tags: video.snippet?.tags || [],
    }
}

/**
 * Stats for many videos, batched 50 ids per call (1 unit per batch).
 * `maxAgeSeconds` controls how stale cached stats may be; syncs pass a short TTL.
 */
export async function getVideosDetails(videoIds: string[], maxAgeSeconds = 30 * 60): Promise<VideoDetails[]> {
    const unique = [...new Set(videoIds)]
    const results: VideoDetails[] = []

    for (let i = 0; i < unique.length; i += 50) {
        const batch = unique.slice(i, i + 50)
        const key = `yt:videos:${[...batch].sort().join(',')}`
        const { value } = await cached(key, maxAgeSeconds, async () => {
            const response = await callYoutube(QUOTA_COST.list, () =>
                youtube.videos.list({
                    part: ['snippet', 'statistics', 'contentDetails'],
                    id: batch,
                    maxResults: 50,
                })
            )
            return (response.data.items || []).map(toVideoDetails)
        })
        results.push(...value)
    }
    return results
}

export async function getVideoDetails(videoId: string): Promise<VideoDetails> {
    const [video] = await getVideosDetails([videoId], 6 * HOUR)
    if (!video) throw new ApiError(404, 'video_not_found', 'Video not found. Check the link and make sure the video is public.')
    return video
}

/** Backwards-compatible single-video stats helper. */
export async function getVideoStats(videoId: string) {
    const video = await getVideoDetails(videoId)
    return {
        viewCount: video.viewCount,
        likeCount: video.likeCount,
        commentCount: video.commentCount,
        durationSeconds: video.durationSeconds,
        tags: video.tags,
    }
}

/** Keyword research search (100 units), cached for a day per query. */
export async function searchVideos(query: string, maxResults = 20) {
    const { value } = await cached(`yt:search-videos:${query.toLowerCase().trim()}:${maxResults}`, DAY, async () => {
        const response = await callYoutube(QUOTA_COST.search, () =>
            youtube.search.list({
                part: ['snippet'],
                q: query,
                type: ['video'],
                maxResults,
                relevanceLanguage: 'en',
            })
        )

        return {
            totalResults: response.data.pageInfo?.totalResults || 0,
            videos: (response.data.items || []).map((item) => ({
                id: item.id?.videoId || '',
                title: item.snippet?.title || '',
                description: item.snippet?.description || '',
                publishedAt: item.snippet?.publishedAt || '',
                thumbnail: item.snippet?.thumbnails?.default?.url || '',
            })),
        }
    })
    return value
}

/**
 * A competitor's top videos by views among their latest uploads: 2 units
 * (playlist + batched stats) instead of a 100-unit `order=viewCount` search.
 */
export async function getTopRecentVideos(channelId: string, limit = 15): Promise<VideoDetails[]> {
    const { value } = await cached(`yt:top-recent:${channelId}:${limit}`, DAY, async () => {
        const uploads = await getChannelVideos(channelId, 50)
        const details = await getVideosDetails(uploads.map((v) => v.videoId), DAY)
        return details.sort((a, b) => b.viewCount - a.viewCount).slice(0, limit)
    })
    return value
}
