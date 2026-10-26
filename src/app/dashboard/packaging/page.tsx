import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase'
import { getUserChannels, getUserPlan, PLAN_LIMITS } from '@/lib/account'
import { PageHeader } from '@/components/ui/page-header'
import { Badge } from '@/components/ui/badge'
import VisionThumbnailEvaluator, { type PickableVideo } from '@/components/dashboard/VisionThumbnailEvaluator'

export default async function PackagingStudioPage() {
    const { userId } = await auth()
    if (!userId) redirect('/sign-in')

    const [channels, plan] = await Promise.all([getUserChannels(userId), getUserPlan(userId)])
    const channel = channels[0]

    let videos: PickableVideo[] = []
    if (channel) {
        const { data } = await supabaseAdmin
            .from('videos')
            .select('id, title, thumbnail_url')
            .eq('channel_id', channel.id)
            .order('published_at', { ascending: false })
            .limit(24)
        videos = (data || []).filter((v): v is PickableVideo => Boolean(v.thumbnail_url))
    }

    return (
        <div className="space-y-8 pb-20">
            <PageHeader
                eyebrow="Packaging Studio"
                title="CTR Vision"
                description="Grade thumbnail and title together before you publish. GPT-4o Vision scores what viewers react to in the first half-second."
                actions={
                    <Badge variant="outline" className="border-slate-200 bg-white px-3 py-1 text-xs font-bold text-slate-500">
                        {PLAN_LIMITS[plan].visionPerDay} grades / day on {plan.charAt(0).toUpperCase() + plan.slice(1)}
                    </Badge>
                }
            />
            <VisionThumbnailEvaluator niche={channel?.niche || 'General'} channelName={channel?.channel_name} videos={videos} />
        </div>
    )
}
