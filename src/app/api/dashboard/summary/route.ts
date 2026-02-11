import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
    try {
        const { userId } = await auth()
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // 1. Get user from Supabase
        const { data: user } = await supabaseAdmin
            .from('users')
            .select('id')
            .eq('clerk_user_id', userId)
            .single()

        if (!user) {
            return NextResponse.json({ recent_videos: [] })
        }

        // 2. Get all channels for user
        const { data: channels } = await supabaseAdmin
            .from('channels')
            .select('id, channel_name, niche')
            .eq('user_id', user.id)

        if (!channels || channels.length === 0) {
            return NextResponse.json({ recent_videos: [], channels: [] })
        }

        const channelIds = channels.map(c => c.id)

        // 3. Get recent videos for these channels
        const { data: videos, error: videoError } = await supabaseAdmin
            .from('videos')
            .select(`
                id,
                title,
                thumbnail_url,
                channel_id
            `)
            .in('channel_id', channelIds)
            .order('published_at', { ascending: false })
            .limit(10)

        if (videoError) throw videoError

        // Add channel name to video objects for UI
        const videosWithChannel = videos.map(v => ({
            ...v,
            channel_name: channels.find(c => c.id === v.channel_id)?.channel_name || 'Unknown Channel'
        }))

        return NextResponse.json({
            recent_videos: videosWithChannel,
            channels: channels
        })

    } catch (error: unknown) {
        console.error('Dashboard summary error:', error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to fetch summary' },
            { status: 500 }
        )
    }
}
