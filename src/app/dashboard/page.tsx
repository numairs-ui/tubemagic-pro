import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/ui/page-header'
import { EmptyState } from '@/components/ui/empty-state'
import { getUserChannels } from '@/lib/account'
import { getChannelVelocity } from '@/lib/channel-sync'
import { compactNumber } from '@/components/charts/chart-theme'
import {
    LucidePlus, LucideTrendingUp, LucideTrendingDown, LucideEye, LucideUsers, LucideImage, LucideLayers,
    LucideArrowRight, LucideActivity, LucideRefreshCcw, LucideYoutube,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export default async function DashboardPage() {
    const { userId } = await auth()
    if (!userId) redirect('/sign-in')

    const channels = await getUserChannels(userId)
    const primary = channels[0]
    const velocity = primary ? (await getChannelVelocity(primary)).velocity : null

    const totalSubscribers = channels.reduce((sum, c) => sum + (c.subscriber_count || 0), 0)
    const totalViews = channels.reduce((sum, c) => sum + (c.total_views || 0), 0)
    const momentum = velocity?.momentumPct ?? null
    const revivalCount = velocity?.revivalCandidates.length ?? 0

    return (
        <div className="space-y-10 pb-20">
            <PageHeader
                eyebrow="Overview"
                title={primary ? `Welcome back, ${primary.channel_name}` : 'Welcome to TubeMagic Velocity'}
                description="Package every upload for the click, repurpose it everywhere, and revive what's fading."
                actions={
                    <Button asChild className="h-11 rounded-xl bg-brand px-6 font-bold shadow-xl shadow-brand/20 hover:bg-brand-hover">
                        <Link href="/dashboard/channels/connect"><LucidePlus className="h-4 w-4" /> Connect channel</Link>
                    </Button>
                }
            />

            {/* Primary workflows */}
            <div className="grid gap-6 md:grid-cols-2">
                <Link href="/dashboard/packaging" className="group block">
                    <Card className="relative h-full overflow-hidden border-none bg-ink text-white shadow-lg transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-2xl group-hover:shadow-brand/20">
                        <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-brand/30 blur-3xl transition-opacity group-hover:opacity-100" />
                        <CardContent className="relative space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand"><LucideImage className="h-5 w-5" /></div>
                                <Badge className="border-none bg-white/10 text-[10px] font-bold uppercase tracking-widest text-white">Before you publish</Badge>
                            </div>
                            <div>
                                <h2 className="text-2xl font-extrabold">Packaging Studio</h2>
                                <p className="mt-1 text-sm text-slate-300">Grade thumbnail + title together with GPT-4o Vision and preview them in a real mobile feed.</p>
                            </div>
                            <span className="inline-flex items-center gap-1 text-sm font-bold text-brand">Grade a thumbnail <LucideArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></span>
                        </CardContent>
                    </Card>
                </Link>
                <Link href="/dashboard/repurpose" className="group block">
                    <Card className="h-full border-none bg-white shadow-sm transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-xl">
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white"><LucideLayers className="h-5 w-5" /></div>
                                <Badge variant="secondary" className="text-[10px] font-bold uppercase tracking-widest">After you publish</Badge>
                            </div>
                            <div>
                                <h2 className="text-2xl font-extrabold text-ink">Repurposing Studio</h2>
                                <p className="mt-1 text-sm text-slate-500">Turn one long-form video into a Shorts script, TikTok hooks, a Community poll and an X thread.</p>
                            </div>
                            <span className="inline-flex items-center gap-1 text-sm font-bold text-blue-600">Repurpose a video <LucideArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></span>
                        </CardContent>
                    </Card>
                </Link>
            </div>

            {primary ? (
                <>
                    {/* Real metrics */}
                    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                        <Metric label="Subscribers" value={compactNumber(totalSubscribers)} icon={LucideUsers} />
                        <Metric label="Lifetime views" value={compactNumber(totalViews)} icon={LucideEye} />
                        <Metric
                            label="Momentum"
                            value={momentum === null ? '–' : `${momentum > 0 ? '+' : ''}${momentum}%`}
                            hint={momentum === null ? 'Needs more uploads' : 'Latest 5 uploads vs previous 10'}
                            icon={momentum !== null && momentum < 0 ? LucideTrendingDown : LucideTrendingUp}
                            tone={momentum === null ? undefined : momentum >= 0 ? 'good' : 'bad'}
                            href="/dashboard/intelligence/audit"
                        />
                        <Metric
                            label="Revival candidates"
                            value={String(revivalCount)}
                            hint="Older videos behind their curve"
                            icon={LucideRefreshCcw}
                            href="/dashboard/revival"
                        />
                    </div>

                    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                        {/* Channels */}
                        <div className="space-y-4 lg:col-span-2">
                            <h2 className="flex items-center gap-2 text-xl font-bold text-ink">
                                Connected channels
                                <Badge variant="outline" className="border-slate-200 text-[10px] font-bold text-slate-400">{channels.length}</Badge>
                            </h2>
                            {channels.map((channel) => (
                                <Card key={channel.id} className="group overflow-hidden border-none bg-white shadow-sm transition-all duration-300 hover:shadow-md">
                                    <div className="flex flex-col items-start gap-4 p-4 sm:flex-row sm:items-center">
                                        {channel.thumbnail_url && (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={channel.thumbnail_url} alt="" referrerPolicy="no-referrer" className="h-14 w-14 rounded-2xl object-cover shadow-sm transition-transform group-hover:scale-105" />
                                        )}
                                        <div className="min-w-0 flex-1 space-y-1">
                                            <div className="flex items-center gap-2">
                                                <h3 className="truncate text-lg font-bold text-slate-900">{channel.channel_name}</h3>
                                                <Badge variant="secondary" className="bg-slate-100 py-0 text-[9px] font-bold uppercase text-slate-500">{channel.niche || 'General'}</Badge>
                                            </div>
                                            <p className="text-xs font-medium text-slate-400">
                                                {(channel.subscriber_count || 0).toLocaleString()} subscribers · {(channel.total_views || 0).toLocaleString()} views
                                            </p>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button variant="outline" size="sm" asChild className="font-bold">
                                                <Link href={`/dashboard/channels/${channel.id}`}>Videos</Link>
                                            </Button>
                                            <Button size="sm" asChild className="bg-brand font-bold hover:bg-brand-hover">
                                                <Link href="/dashboard/intelligence/audit">Audit</Link>
                                            </Button>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>

                        {/* Next best action, derived from real data */}
                        <div className="space-y-4">
                            <h2 className="text-xl font-bold text-ink">Next best move</h2>
                            <NextMove momentum={momentum} revivalCount={revivalCount} daysSinceLastUpload={velocity?.daysSinceLastUpload ?? null} />
                        </div>
                    </div>
                </>
            ) : (
                <EmptyState
                    icon={LucideYoutube}
                    tone="brand"
                    title="Connect your channel to unlock velocity insights"
                    description="Packaging and Repurposing Studio work right away. Connect a channel to get your Velocity Audit, momentum tracking and revival candidates."
                    action={
                        <Button asChild className="h-11 rounded-xl bg-brand px-8 font-bold hover:bg-brand-hover">
                            <Link href="/dashboard/channels/connect">Connect now</Link>
                        </Button>
                    }
                />
            )}
        </div>
    )
}

function Metric({ label, value, hint, icon: Icon, tone, href }: {
    label: string
    value: string
    hint?: string
    icon: typeof LucideUsers
    tone?: 'good' | 'bad'
    href?: string
}) {
    const body = (
        <Card className={cn('h-full border-none bg-white shadow-sm transition-all duration-300', href && 'group-hover:-translate-y-1 group-hover:shadow-md')}>
            <CardContent>
                <div className="mb-3 flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">{label}</span>
                    <div className={cn(
                        'flex h-8 w-8 items-center justify-center rounded-lg',
                        tone === 'good' ? 'bg-emerald-50 text-emerald-600' : tone === 'bad' ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-500'
                    )}>
                        <Icon className="h-4 w-4" />
                    </div>
                </div>
                <div className="text-3xl font-extrabold text-slate-900">{value}</div>
                {hint && <p className="mt-1 text-[11px] text-slate-500">{hint}</p>}
            </CardContent>
        </Card>
    )
    return href ? <Link href={href} className="group block">{body}</Link> : body
}

function NextMove({ momentum, revivalCount, daysSinceLastUpload }: { momentum: number | null; revivalCount: number; daysSinceLastUpload: number | null }) {
    const move =
        daysSinceLastUpload !== null && daysSinceLastUpload > 21
            ? { title: `${Math.round(daysSinceLastUpload)} days since your last upload`, body: 'Repurpose your best recent video into Shorts to stay in viewers’ feeds while you produce the next one.', href: '/dashboard/repurpose', cta: 'Open Repurposing Studio', icon: LucideLayers }
            : momentum !== null && momentum < -10
                ? { title: `Recent uploads are ${Math.abs(momentum)}% below your norm`, body: 'Packaging is the fastest lever. Grade your next thumbnail and title combo before publishing.', href: '/dashboard/packaging', cta: 'Open Packaging Studio', icon: LucideImage }
                : revivalCount > 0
                    ? { title: `${revivalCount} older videos are leaving views on the table`, body: 'A new title and thumbnail can restart suggested traffic on videos that already proved their topic.', href: '/dashboard/revival', cta: 'Open Video Revival', icon: LucideRefreshCcw }
                    : { title: 'Your channel is in good shape', body: 'Run the Velocity Audit for a full 10-point check, and keep grading packaging before each upload.', href: '/dashboard/intelligence/audit', cta: 'Run Velocity Audit', icon: LucideActivity }

    return (
        <Card className="border-none bg-white shadow-sm">
            <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-soft text-brand"><move.icon className="h-5 w-5" /></div>
                    <p className="text-sm font-bold leading-snug text-slate-900">{move.title}</p>
                </div>
                <p className="text-sm leading-relaxed text-slate-600">{move.body}</p>
                <Button asChild className="h-11 w-full rounded-xl bg-brand font-bold hover:bg-brand-hover">
                    <Link href={move.href}>{move.cta}</Link>
                </Button>
            </CardContent>
        </Card>
    )
}
