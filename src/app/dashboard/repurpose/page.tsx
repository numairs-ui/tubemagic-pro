import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase'
import { getUserChannels } from '@/lib/account'
import { PageHeader } from '@/components/ui/page-header'
import ScriptRepurposerPanel from '@/components/dashboard/ScriptRepurposerPanel'

export default async function RepurposingStudioPage() {
    const { userId } = await auth()
    if (!userId) redirect('/sign-in')

    const channels = await getUserChannels(userId)
    const channel = channels[0]

    let videos: { id: string; title: string; description: string | null }[] = []
    if (channel) {
        const { data } = await supabaseAdmin
            .from('videos')
            .select('id, title, description')
            .eq('channel_id', channel.id)
            .order('published_at', { ascending: false })
            .limit(20)
        videos = data || []
    }

    return (
        <div className="space-y-8 pb-20">
            <PageHeader
                eyebrow="Repurposing Studio"
                title="One video, every format"
                description="Turn a long-form upload into a Shorts script, TikTok hooks, a Community poll and an X thread that all point back to the full video."
            />
            <ScriptRepurposerPanel niche={channel?.niche || 'General'} videos={videos} />
        </div>
    )
}
