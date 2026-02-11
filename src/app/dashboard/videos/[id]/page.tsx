import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LucideEye, LucideThumbsUp, LucideMessageSquare, LucideArrowLeft, LucideVideo, LucideLayout, LucideCheckCircle } from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'

import OptimizationPanel from '@/components/dashboard/OptimizationPanel'

export default async function VideoDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const { userId } = await auth()
    if (!userId) redirect('/sign-in')

    // 1. Get video data with channel info
    const { data: video, error: videoError } = await supabaseAdmin
        .from('videos')
        .select(`
      *,
      channels (*)
    `)
        .eq('id', id)
        .single()

    if (videoError || !video) {
        return (
            <div className="text-center py-20">
                <h2 className="text-xl font-semibold">Video not found</h2>
                <Button asChild variant="link" className="mt-4">
                    <Link href="/dashboard">Back to Dashboard</Link>
                </Button>
            </div>
        )
    }

    return (
        <div className="space-y-8 pb-20">
            {/* Header */}
            <div className="flex items-center justify-between">
                <Button variant="ghost" asChild>
                    <Link href={`/dashboard/channels/${video.channel_id}`}>
                        <LucideArrowLeft className="w-4 h-4 mr-2" />
                        Back to Channel
                    </Link>
                </Button>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" asChild>
                        <a href={`https://youtube.com/watch?v=${video.youtube_video_id}`} target="_blank" rel="noreferrer">
                            <LucideLayout className="w-4 h-4 mr-2" />
                            Preview on YouTube
                        </a>
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Video Info & Preview */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="overflow-hidden">
                        <div className="aspect-video relative bg-slate-100">
                            <img
                                src={video.thumbnail_url}
                                className="w-full h-full object-cover"
                                alt=""
                                referrerPolicy="no-referrer"
                            />
                            <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center text-white">
                                    <LucideVideo className="w-8 h-8 fill-current" />
                                </div>
                            </div>
                        </div>
                        <CardHeader>
                            <div className="flex items-center gap-2 mb-2">
                                <Badge variant="secondary" className="bg-red-50 text-red-700 hover:bg-red-100 border-red-100">
                                    Live on YouTube
                                </Badge>
                                <span className="text-xs text-slate-500">
                                    Published {formatDistanceToNow(new Date(video.published_at), { addSuffix: true })}
                                </span>
                            </div>
                            <CardTitle className="text-2xl leading-tight">{video.title}</CardTitle>
                            <CardDescription className="line-clamp-3">
                                {video.description}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-wrap gap-2">
                                {video.tags?.map((tag: string) => (
                                    <Badge key={tag} variant="outline" className="text-[10px] font-normal text-slate-500">
                                        #{tag}
                                    </Badge>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Stats Bar */}
                    <div className="grid grid-cols-3 gap-4">
                        <Card>
                            <CardContent className="pt-6 text-center">
                                <LucideEye className="w-5 h-5 text-slate-400 mx-auto mb-2" />
                                <div className="text-xl font-bold">{video.view_count?.toLocaleString()}</div>
                                <p className="text-[10px] text-slate-500 uppercase tracking-wider">Views</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="pt-6 text-center">
                                <LucideThumbsUp className="w-5 h-5 text-slate-400 mx-auto mb-2" />
                                <div className="text-xl font-bold">{video.like_count?.toLocaleString()}</div>
                                <p className="text-[10px] text-slate-500 uppercase tracking-wider">Likes</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="pt-6 text-center">
                                <LucideMessageSquare className="w-5 h-5 text-slate-400 mx-auto mb-2" />
                                <div className="text-xl font-bold">{video.comment_count?.toLocaleString()}</div>
                                <p className="text-[10px] text-slate-500 uppercase tracking-wider">Comments</p>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Right Column: AI Optimization Panel */}
                <div className="space-y-6">
                    <OptimizationPanel video={video} />

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm">Quick Checklist</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                                <LucideCheckCircle className="w-4 h-4 text-green-500" />
                                <span>Channel Connected</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                                <LucideCheckCircle className="w-4 h-4 text-green-500" />
                                <span>Metadata Ingested</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}

