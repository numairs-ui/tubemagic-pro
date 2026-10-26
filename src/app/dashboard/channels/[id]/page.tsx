import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase'
import { getUserChannels } from '@/lib/account'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LucideVideo, LucideEye, LucideThumbsUp, LucideMessageSquare, LucideArrowLeft, LucideExternalLink, LucideZap, LucideLoader2 } from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import CompetitorPanel from '@/components/dashboard/CompetitorPanel'
import QuickOptimizeButton from '@/components/dashboard/QuickOptimizeButton'

export default async function ChannelDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const { userId } = await auth()
    if (!userId) redirect('/sign-in')

    // 1. Get channel data (only channels this user owns)
    const channel = (await getUserChannels(userId)).find((c) => c.id === id)

    if (!channel) {
        return (
            <div className="text-center py-20">
                <h2 className="text-xl font-semibold">Channel not found</h2>
                <Button asChild variant="link" className="mt-4">
                    <Link href="/dashboard">Back to Dashboard</Link>
                </Button>
            </div>
        )
    }

    // 2. Get videos for this channel
    const { data: videos } = await supabaseAdmin
        .from('videos')
        .select('*')
        .eq('channel_id', channel.id)
        .order('published_at', { ascending: false })

    // 3. Get competitors
    const { data: competitors } = await supabaseAdmin
        .from('competitors')
        .select('*')
        .eq('channel_id', channel.id)

    return (
        <div className="space-y-12 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center space-x-4">
                    <Button variant="outline" size="icon" asChild>
                        <Link href="/dashboard">
                            <LucideArrowLeft className="w-4 h-4" />
                        </Link>
                    </Button>
                    <img
                        src={channel.thumbnail_url ?? undefined}
                        referrerPolicy="no-referrer"
                        className="h-16 w-16 rounded-full border-2 border-white shadow-sm object-cover"
                        alt=""
                    />
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                            {channel.channel_name}
                            <Badge variant="secondary" className="font-normal text-xs">
                                {channel.niche || "Software Engineering"}
                            </Badge>
                        </h1>
                        <div className="flex items-center gap-3 text-slate-500 text-sm mt-1">
                            <span className="flex items-center gap-1">
                                <LucideVideo className="w-3 h-3" /> {channel.total_videos} videos
                            </span>
                            <span>•</span>
                            <span>{channel.subscriber_count?.toLocaleString()} subscribers</span>
                            <a href={channel.channel_url} target="_blank" rel="noreferrer" className="text-red-600 hover:underline flex items-center gap-1">
                                View on YouTube <LucideExternalLink className="w-3 h-3" />
                            </a>
                        </div>
                    </div>
                </div>
                <QuickOptimizeButton latestVideoId={videos?.[0]?.id} />
            </div>

            {/* Competitor Section */}
            <section className="pt-8 border-t">
                <CompetitorPanel channelId={channel.id} competitors={competitors || []} />
            </section>

            {/* Videos List */}
            <section className="space-y-6 pt-8 border-t">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold">Recent Videos</h2>
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-slate-500">Showing last {videos?.length || 0} videos</span>
                    </div>
                </div>

                {videos && videos.length > 0 ? (
                    <div className="grid gap-4">
                        {videos.map((video) => (
                            <Card key={video.id} className="overflow-hidden hover:border-red-200 transition-colors group">
                                <CardContent className="p-0 flex flex-col sm:flex-row">
                                    {/* Thumbnail */}
                                    <div className="relative w-full sm:w-64 aspect-video sm:aspect-auto">
                                        <img
                                            src={video.thumbnail_url}
                                            alt=""
                                            referrerPolicy="no-referrer"
                                            className="absolute inset-0 w-full h-full object-cover"
                                        />
                                        <div className="absolute bottom-2 right-2 bg-black/80 text-white text-[10px] px-1.5 py-0.5 rounded font-mono">
                                            {Math.floor(video.duration / 60)}:{String(video.duration % 60).padStart(2, '0')}
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 p-4 flex flex-col justify-between">
                                        <div>
                                            <div className="flex items-start justify-between gap-2">
                                                <Link href={`/dashboard/videos/${video.id}`} className="font-semibold text-lg line-clamp-2 group-hover:text-red-600 transition-colors">
                                                    {video.title}
                                                </Link>
                                                <Badge variant="outline" className="text-[10px] bg-slate-50 whitespace-nowrap">
                                                    {formatDistanceToNow(new Date(video.published_at), { addSuffix: true })}
                                                </Badge>
                                            </div>
                                            <p className="text-slate-500 text-sm line-clamp-1 mt-1">{video.description}</p>
                                        </div>

                                        <div className="flex items-center justify-between mt-4">
                                            <div className="flex items-center gap-4 text-slate-500 text-xs">
                                                <span className="flex items-center gap-1">
                                                    <LucideEye className="w-3.5 h-3.5" /> {video.view_count?.toLocaleString()}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <LucideThumbsUp className="w-3.5 h-3.5" /> {video.like_count?.toLocaleString()}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <LucideMessageSquare className="w-3.5 h-3.5" /> {video.comment_count?.toLocaleString()}
                                                </span>
                                            </div>
                                            <Button size="sm" variant="outline" asChild className="group-hover:bg-red-600 group-hover:text-white group-hover:border-red-600 transition-all">
                                                <Link href={`/dashboard/videos/${video.id}`}>
                                                    Optimize
                                                </Link>
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="py-20 text-center border-2 border-dashed rounded-xl">
                        <LucideLoader2 className="w-10 h-10 text-slate-200 animate-spin mx-auto mb-4" />
                        <p className="text-slate-500">Your videos are still being indexed. Please wait a moment...</p>
                        <p className="text-xs text-slate-400 mt-2">Connecting to YouTube Data API and fetching metadata...</p>
                    </div>
                )}
            </section>
        </div>
    )
}
