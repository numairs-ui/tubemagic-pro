import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { PageHeader } from '@/components/ui/page-header'
import { EmptyState } from '@/components/ui/empty-state'
import AgeCurveChart from '@/components/charts/AgeCurveChart'
import { compactNumber } from '@/components/charts/chart-theme'
import { getUserChannels } from '@/lib/account'
import { getChannelVelocity } from '@/lib/channel-sync'
import { LucideEye, LucideMousePointer2, LucideMessageSquare, LucideActivity, LucideBarChart3 } from "lucide-react"

export default async function AnalyticsPage() {
    const { userId } = await auth()
    if (!userId) redirect('/sign-in')

    const channels = await getUserChannels(userId)
    const channel = channels[0]

    if (!channel) {
        return (
            <div className="space-y-8 pb-20">
                <PageHeader eyebrow="Grow" title="Performance" />
                <EmptyState
                    icon={LucideBarChart3}
                    title="Connect a channel to see performance"
                    description="We'll chart every recent upload against your channel's own growth curve."
                    action={<Button asChild className="rounded-xl bg-brand font-bold hover:bg-brand-hover"><Link href="/dashboard/channels/connect">Connect channel</Link></Button>}
                />
            </div>
        )
    }

    const { videos, velocity } = await getChannelVelocity(channel)

    const totalViews = videos.reduce((sum, v) => sum + (v.view_count || 0), 0)
    const totalLikes = videos.reduce((sum, v) => sum + (v.like_count || 0), 0)
    const totalComments = videos.reduce((sum, v) => sum + (v.comment_count || 0), 0)
    const likeRate = totalViews ? (totalLikes / totalViews) * 100 : 0
    const ranked = [...velocity.videos].filter((v) => v.ageDays >= 3).sort((a, b) => b.performanceIndex - a.performanceIndex)

    return (
        <div className="space-y-10 pb-20">
            <PageHeader
                eyebrow="Grow"
                title="Performance"
                description={<>Age-adjusted performance for <span className="font-bold text-ink">{channel.channel_name}</span>&apos;s last {videos.length} uploads.</>}
            />

            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                {[
                    { label: 'Views (recent uploads)', value: compactNumber(totalViews), icon: LucideEye },
                    { label: 'Like rate', value: `${likeRate.toFixed(1)}%`, icon: LucideMousePointer2 },
                    { label: 'Comments', value: compactNumber(totalComments), icon: LucideMessageSquare },
                    { label: 'Views / day (median)', value: compactNumber(velocity.medianViewsPerDay), icon: LucideActivity },
                ].map((m) => (
                    <Card key={m.label} className="border-none shadow-sm">
                        <CardContent>
                            <div className="mb-3 flex items-center justify-between">
                                <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">{m.label}</span>
                                <m.icon className="h-4 w-4 text-slate-400" />
                            </div>
                            <div className="text-3xl font-extrabold text-ink">{m.value}</div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {videos.length > 0 ? (
                <>
                    <Card className="border-none shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-lg font-bold">Growth curve</CardTitle>
                            <CardDescription>Each dot is a video. The line is what your channel typically reaches at each age.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <AgeCurveChart videos={velocity.videos} curve={velocity.curvePoints} candidateIds={velocity.revivalCandidates.map((c) => c.id)} />
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-lg font-bold">Uploads ranked by performance</CardTitle>
                            <CardDescription>Performance = actual views ÷ typical views at the same age. 1.0× is your baseline.</CardDescription>
                        </CardHeader>
                        <CardContent className="overflow-x-auto p-0">
                            <table className="w-full min-w-[560px] text-sm">
                                <thead>
                                    <tr className="border-b text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                        <th className="px-6 py-3">Video</th>
                                        <th className="px-4 py-3 text-right">Age</th>
                                        <th className="px-4 py-3 text-right">Views</th>
                                        <th className="px-6 py-3 text-right">Performance</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {ranked.map((v) => (
                                        <tr key={v.id} className="border-b last:border-0 hover:bg-slate-50">
                                            <td className="max-w-md px-6 py-3">
                                                <Link href={`/dashboard/videos/${v.id}`} className="line-clamp-1 font-medium text-slate-800 hover:text-brand">{v.title}</Link>
                                            </td>
                                            <td className="px-4 py-3 text-right tabular-nums text-slate-500">{Math.round(v.ageDays)}d</td>
                                            <td className="px-4 py-3 text-right tabular-nums text-slate-700">{v.views.toLocaleString()}</td>
                                            <td className="px-6 py-3 text-right">
                                                <Badge className={`border-none font-bold tabular-nums ${v.performanceIndex >= 1 ? 'bg-blue-50 text-blue-700' : 'bg-red-50 text-red-700'}`}>
                                                    {v.performanceIndex.toFixed(2)}×
                                                </Badge>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </CardContent>
                    </Card>
                </>
            ) : (
                <EmptyState icon={LucideBarChart3} title="Videos are still syncing" description="Check back in a minute while we ingest your uploads." />
            )}
        </div>
    )
}
