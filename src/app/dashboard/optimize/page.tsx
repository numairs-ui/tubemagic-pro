"use client"

import { Card, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/ui/page-header"
import { LucideZap, LucideSparkles, LucideLoader2, LucideChevronRight, LucideImage, LucideLayers } from "lucide-react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface Video {
    id: string
    title: string
    thumbnail_url: string
    channel_name: string
}

interface Idea {
    title: string
    hook: string
    keywords: string[]
}

interface Channel {
    id: string
    channel_name: string
    niche: string | null
}

export default function OptimizePage() {
    const router = useRouter()
    const [isLoadingIdeas, setIsLoadingIdeas] = useState(false)
    const [ideas, setIdeas] = useState<Idea[]>([])
    const [videos, setVideos] = useState<Video[]>([])
    const [channels, setChannels] = useState<Channel[]>([])
    const [selectedNiche, setSelectedNiche] = useState("Software Engineering")
    const [isLoadingVideos, setIsLoadingVideos] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        fetchDashboardData()
    }, [])

    const fetchDashboardData = async () => {
        try {
            const res = await fetch("/api/dashboard/summary")
            const data = await res.json()
            if (data.recent_videos) {
                setVideos(data.recent_videos)
            }
            if (data.channels) {
                setChannels(data.channels)
                // Set initial niche from first channel if available
                if (data.channels[0]?.niche) {
                    setSelectedNiche(data.channels[0].niche)
                }
            }
        } catch (err) {
            console.error("Failed to fetch dashboard data:", err)
            setError("Failed to load your latest channel data. Please refresh.")
        } finally {
            setIsLoadingVideos(false)
        }
    }

    const handleGenerateIdeas = async () => {
        setIsLoadingIdeas(true)
        setError(null)
        try {
            const res = await fetch("/api/ai/ideas", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ niche: selectedNiche })
            })
            const data = await res.json()
            if (data.ideas) {
                setIdeas(data.ideas)
            } else {
                setError(data.error || "Failed to generate ideas")
            }
        } catch {
            setError("An unexpected error occurred while connecting to AI.")
        } finally {
            setIsLoadingIdeas(false)
        }
    }

    return (
        <div className="space-y-8 pb-20">
            <PageHeader
                eyebrow="SEO Toolkit"
                title="Title & SEO Optimizer"
                description="Rewrite titles, descriptions and tags for an existing video, or brainstorm new ideas for your niche."
            />

            <div className="grid gap-6 md:grid-cols-2">
                {/* Title Optimization Card */}
                <Card className="border-dashed flex flex-col p-8 space-y-4">
                    <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center">
                            <LucideZap className="w-6 h-6 text-red-600" />
                        </div>
                        <div>
                            <CardTitle>Title In-Place Optimization</CardTitle>
                            <CardDescription>Select a video to start optimizing.</CardDescription>
                        </div>
                    </div>

                    <div className="flex-1 overflow-auto max-h-[300px] border rounded-lg bg-slate-50/50 p-2">
                        {isLoadingVideos ? (
                            <div className="flex items-center justify-center py-8">
                                <LucideLoader2 className="w-6 h-6 animate-spin text-slate-300" />
                            </div>
                        ) : videos.length > 0 ? (
                            <div className="space-y-2">
                                {videos.map((video) => (
                                    <button
                                        key={video.id}
                                        onClick={() => router.push(`/dashboard/videos/${video.id}`)}
                                        className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200 transition-all text-left"
                                    >
                                        <img src={video.thumbnail_url} className="w-16 aspect-video rounded object-cover" alt="" referrerPolicy="no-referrer" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium line-clamp-1">{video.title}</p>
                                            <p className="text-[10px] text-slate-500">{video.channel_name}</p>
                                        </div>
                                        <LucideChevronRight className="w-4 h-4 text-slate-300" />
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 px-4">
                                <p className="text-sm text-slate-500 mb-4">No videos found. Connecting a channel will sync your data.</p>
                                <Button asChild size="sm" variant="outline" className="border-red-200 text-red-700">
                                    <Link href="/dashboard/channels/connect">Connect Channel</Link>
                                </Button>
                            </div>
                        )}
                    </div>
                </Card>

                {/* Ideas Generator Card */}
                <Card className="border-dashed flex flex-col p-8 space-y-4">
                    <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center">
                            <LucideSparkles className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <CardTitle>Viral Idea Generator</CardTitle>
                            <CardDescription>Get 10 fresh ideas for your niche.</CardDescription>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Niche Context</label>
                        <select
                            value={selectedNiche}
                            onChange={(e) => setSelectedNiche(e.target.value)}
                            className="w-full p-2 bg-slate-50 border rounded-md text-xs outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            {channels.length > 0 ? (
                                channels.map(c => (
                                    <option key={c.id} value={c.niche || "Software Engineering"}>
                                        {c.channel_name} ({c.niche || "Software Engineering"})
                                    </option>
                                ))
                            ) : (
                                <option>Software Engineering</option>
                            )}
                        </select>
                    </div>

                    <div className="flex-1 flex flex-col justify-center space-y-4">
                        {ideas.length === 0 ? (
                            <div className="text-center space-y-4">
                                <p className="text-sm text-slate-500">
                                    Click below to generate 10 fresh video ideas based on your niche and competitors.
                                </p>
                                <Button
                                    onClick={handleGenerateIdeas}
                                    disabled={isLoadingIdeas}
                                    className="bg-blue-600 hover:bg-blue-700 w-full font-bold shadow-lg shadow-blue-600/20"
                                >
                                    {isLoadingIdeas ? <LucideLoader2 className="w-4 h-4 animate-spin mr-2" /> : <LucideSparkles className="w-4 h-4 mr-2" />}
                                    Generate Ideas
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="max-h-[300px] overflow-auto border rounded-lg bg-blue-50/20 p-3 space-y-3">
                                    {ideas.map((idea, i) => (
                                        <div key={i} className="bg-white p-3 rounded-md shadow-sm border border-blue-100 animate-in fade-in zoom-in-95 duration-300">
                                            <p className="text-sm font-bold text-blue-900">{idea.title}</p>
                                            <p className="text-xs text-blue-700/70 mt-1">{idea.hook}</p>
                                            <div className="flex flex-wrap gap-1 mt-2">
                                                {idea.keywords.map(kw => (
                                                    <span key={kw} className="text-[9px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded border border-blue-100 italic font-medium">#{kw}</span>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <Button
                                    variant="outline"
                                    onClick={handleGenerateIdeas}
                                    disabled={isLoadingIdeas}
                                    className="w-full border-blue-200 text-blue-700 hover:bg-blue-50 font-bold"
                                >
                                    Regenerate Ideas
                                </Button>
                            </div>
                        )}
                        {error && <p className="text-[10px] text-red-500 text-center font-medium bg-red-50 p-2 rounded">{error}</p>}
                    </div>
                </Card>
            </div>

            {/* The CTR scorer and repurposer now live in their own studios. */}
            <div className="grid gap-4 md:grid-cols-2">
                <Link href="/dashboard/packaging" className="group flex items-center gap-4 rounded-xl bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
                    <LucideImage className="h-6 w-6 text-brand" />
                    <div className="flex-1">
                        <p className="font-bold text-slate-900">Grade the thumbnail too</p>
                        <p className="text-sm text-slate-500">Packaging Studio scores title + thumbnail together.</p>
                    </div>
                    <LucideChevronRight className="h-4 w-4 text-slate-300 transition-transform group-hover:translate-x-1" />
                </Link>
                <Link href="/dashboard/repurpose" className="group flex items-center gap-4 rounded-xl bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
                    <LucideLayers className="h-6 w-6 text-blue-600" />
                    <div className="flex-1">
                        <p className="font-bold text-slate-900">Repurpose into Shorts</p>
                        <p className="text-sm text-slate-500">Hooks, scripts, polls and threads from one video.</p>
                    </div>
                    <LucideChevronRight className="h-4 w-4 text-slate-300 transition-transform group-hover:translate-x-1" />
                </Link>
            </div>
        </div>
    )
}
