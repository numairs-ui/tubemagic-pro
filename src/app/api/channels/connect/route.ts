import { auth, currentUser } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getChannelData, getChannelVideos, getVideoStats, extractChannelIdOrHandle } from '@/lib/youtube'

export async function POST(req: Request) {
    try {
        const { userId } = await auth()
        const userDetails = await currentUser()

        if (!userId || !userDetails) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { channelId: rawInput } = await req.json()
        if (!rawInput) {
            return NextResponse.json({ error: 'Channel ID, handle, or URL is required' }, { status: 400 })
        }

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
            return NextResponse.json({ error: 'Failed to sync user with database.' }, { status: 500 })
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

        // 4. Trigger video ingestion (async - don't wait for completion in the response)
        // In a production app, this should be a background job (e.g., Inngest or Upstash)
        ingestVideos(channel.id, channelData.id).catch(err => console.error('Ingestion error:', err))

        return NextResponse.json({
            success: true,
            message: 'Channel connected successfully. Video ingestion started.',
            channel
        })

    } catch (error: unknown) {
        console.error('Connect channel error:', error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to connect channel' },
            { status: 500 }
        )
    }
}

async function ingestVideos(dbChannelId: string, youtubeChannelId: string) {
    try {
        // Fetch last 50 videos
        const videos = await getChannelVideos(youtubeChannelId, 50)

        for (const video of videos) {
            // Get detailed stats for each video (tags, duration, views)
            const stats = await getVideoStats(video.videoId)

            await supabaseAdmin.from('videos').upsert({
                channel_id: dbChannelId,
                youtube_video_id: video.videoId,
                title: video.title,
                description: video.description,
                published_at: video.publishedAt,
                view_count: stats.viewCount,
                like_count: stats.likeCount,
                comment_count: stats.commentCount,
                duration: parseISO8601Duration(stats.duration),
                tags: stats.tags,
                thumbnail_url: video.thumbnailUrl,
                fetched_at: new Date().toISOString(),
            }, { onConflict: 'youtube_video_id' })
        }

        console.log(`Successfully ingested videos for channel ${youtubeChannelId}`)
    } catch (error) {
        console.error(`Error ingesting videos for ${youtubeChannelId}:`, error)
    }
}

// Utility to convert ISO 8601 duration (like PT1M30S) to seconds
function parseISO8601Duration(duration: string): number {
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return 0;
    const hours = parseInt(match[1] || '0');
    const minutes = parseInt(match[2] || '0');
    const seconds = parseInt(match[3] || '0');
    return hours * 3600 + minutes * 60 + seconds;
}
