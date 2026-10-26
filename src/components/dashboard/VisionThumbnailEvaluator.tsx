"use client"

import { useEffect, useState } from "react"
import { formatDistanceToNow } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScoreRing, scoreTone } from "@/components/ui/score-ring"
import { EmptyState } from "@/components/ui/empty-state"
import ScoreBreakdown, { type PackagingScores } from "@/components/packaging/ScoreBreakdown"
import FeedPreview from "@/components/packaging/FeedPreview"
import ThumbnailDropzone from "@/components/packaging/ThumbnailDropzone"
import {
    LucideSparkles, LucideLoader2, LucideCheckCircle2, LucideAlertCircle, LucideLink, LucideUpload,
    LucideVideo, LucideXCircle, LucideLightbulb, LucideHistory, LucideCornerDownLeft, LucideGauge,
} from "lucide-react"
import { cn } from "@/lib/utils"

export interface PickableVideo {
    id: string
    title: string
    thumbnail_url: string
}

interface VisionThumbnailEvaluatorProps {
    initialTitle?: string
    niche?: string
    channelName?: string
    videos?: PickableVideo[]
}

interface EvaluationResult {
    predicted_ctr_score: number
    verdict: string
    scores: PackagingScores
    strengths: string[]
    weaknesses: string[]
    actionable_tips: string[]
    title_alternatives: string[]
    thumbnail_concepts: string[]
    cached: boolean
    image_stats?: { bytes: number; originalBytes: number; approxTokens: number }
}

interface HistoryItem {
    id: string
    title: string
    score: number
    verdict: string
    created_at: string
}

type Source = "upload" | "url" | "library"

export default function VisionThumbnailEvaluator({ initialTitle = "", niche = "General", channelName, videos = [] }: VisionThumbnailEvaluatorProps) {
    const [source, setSource] = useState<Source>("upload")
    const [upload, setUpload] = useState<string | null>(null)
    const [imageUrl, setImageUrl] = useState("")
    const [libraryImage, setLibraryImage] = useState<string | null>(null)
    const [title, setTitle] = useState(initialTitle)
    const [isAnalyzing, setIsAnalyzing] = useState(false)
    const [result, setResult] = useState<EvaluationResult | null>(null)
    const [gradedTitle, setGradedTitle] = useState("")
    const [error, setError] = useState<string | null>(null)
    const [history, setHistory] = useState<HistoryItem[]>([])

    const image = source === "upload" ? upload : source === "url" ? (imageUrl.startsWith("https://") ? imageUrl : null) : libraryImage

    const loadHistory = async () => {
        try {
            const res = await fetch("/api/ai/vision-ctr")
            const data = await res.json()
            if (Array.isArray(data.history)) setHistory(data.history)
        } catch {
            // History is a convenience; ignore failures.
        }
    }

    useEffect(() => {
        loadHistory()
    }, [])

    const handleAnalyze = async () => {
        if (!image || title.trim().length < 3) return
        setIsAnalyzing(true)
        setError(null)

        try {
            const res = await fetch("/api/ai/vision-ctr", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ image, title: title.trim(), niche }),
            })

            const data = await res.json()
            if (!res.ok) throw new Error(data.error || "Thumbnail evaluation failed")
            setResult(data)
            setGradedTitle(title.trim())
            loadHistory()
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Thumbnail evaluation failed")
        } finally {
            setIsAnalyzing(false)
        }
    }

    const titleChanged = result && title.trim() !== gradedTitle

    return (
        <div className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-5">
                {/* Inputs */}
                <Card className="border-none shadow-sm lg:col-span-3">
                    <CardHeader>
                        <CardTitle className="text-lg font-bold">Thumbnail + title</CardTitle>
                        <CardDescription>Graded together, the way they appear in the feed.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-5">
                        <div className="flex rounded-xl bg-slate-100 p-1" role="tablist" aria-label="Thumbnail source">
                            {([
                                { id: "upload", label: "Upload", icon: LucideUpload },
                                { id: "url", label: "Image URL", icon: LucideLink },
                                { id: "library", label: "My videos", icon: LucideVideo },
                            ] as const).map((tab) => (
                                <button
                                    key={tab.id}
                                    type="button"
                                    role="tab"
                                    aria-selected={source === tab.id}
                                    onClick={() => setSource(tab.id)}
                                    className={cn(
                                        "flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold transition-all sm:text-sm",
                                        source === tab.id ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"
                                    )}
                                >
                                    <tab.icon className="h-4 w-4" /> {tab.label}
                                </button>
                            ))}
                        </div>

                        {source === "upload" && <ThumbnailDropzone value={upload} onChange={setUpload} onError={setError} />}

                        {source === "url" && (
                            <div className="space-y-2">
                                <label htmlFor="thumb-url" className="text-xs font-semibold uppercase tracking-wider text-slate-500">Thumbnail image URL</label>
                                <input
                                    id="thumb-url"
                                    type="url"
                                    value={imageUrl}
                                    onChange={(e) => setImageUrl(e.target.value)}
                                    placeholder="https://i.ytimg.com/vi/…/maxresdefault.jpg"
                                    className="w-full rounded-xl border p-3 text-sm outline-none focus:ring-2 focus:ring-brand"
                                />
                            </div>
                        )}

                        {source === "library" && (
                            videos.length > 0 ? (
                                <div className="grid max-h-72 grid-cols-2 gap-2 overflow-y-auto pr-1 sm:grid-cols-3">
                                    {videos.map((video) => (
                                        <button
                                            key={video.id}
                                            type="button"
                                            onClick={() => { setLibraryImage(video.thumbnail_url); setTitle(video.title) }}
                                            className={cn(
                                                "overflow-hidden rounded-lg border-2 text-left transition-all hover:-translate-y-0.5",
                                                libraryImage === video.thumbnail_url ? "border-brand ring-2 ring-brand/20" : "border-transparent"
                                            )}
                                        >
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img src={video.thumbnail_url} alt="" referrerPolicy="no-referrer" className="aspect-video w-full object-cover" />
                                            <p className="line-clamp-2 p-1.5 text-[11px] font-medium text-slate-700">{video.title}</p>
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <p className="rounded-xl bg-slate-50 p-4 text-center text-sm text-slate-500">Connect a channel to pick from your uploads.</p>
                            )
                        )}

                        <div className="space-y-2">
                            <div className="flex items-baseline justify-between">
                                <label htmlFor="video-title" className="text-xs font-semibold uppercase tracking-wider text-slate-500">Video title</label>
                                <span className={cn("text-[11px] tabular-nums", title.length > 70 ? "font-bold text-amber-600" : "text-slate-400")}>{title.length}/100</span>
                            </div>
                            <input
                                id="video-title"
                                type="text"
                                value={title}
                                maxLength={100}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Enter proposed video title..."
                                className="w-full rounded-xl border p-3 text-sm outline-none focus:ring-2 focus:ring-brand"
                            />
                        </div>

                        <Button
                            onClick={handleAnalyze}
                            disabled={isAnalyzing || !image || title.trim().length < 3}
                            className="h-12 w-full rounded-xl bg-brand font-bold shadow-lg shadow-brand/20 hover:bg-brand-hover"
                        >
                            {isAnalyzing ? (
                                <><LucideLoader2 className="h-4 w-4 animate-spin" /> Grading packaging…</>
                            ) : titleChanged ? (
                                <><LucideSparkles className="h-4 w-4" /> Re-grade with new title</>
                            ) : (
                                <><LucideSparkles className="h-4 w-4" /> Grade thumbnail &amp; title</>
                            )}
                        </Button>

                        {error && (
                            <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert">
                                <LucideAlertCircle className="h-4 w-4 shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Preview */}
                <Card className="border-none shadow-sm lg:col-span-2">
                    <CardContent className="pt-0">
                        <FeedPreview image={image} title={title} channelName={channelName} />
                    </CardContent>
                </Card>
            </div>

            {/* Results */}
            {isAnalyzing && !result && (
                <div className="grid animate-pulse gap-6 lg:grid-cols-3">
                    <div className="h-64 rounded-xl bg-white" />
                    <div className="h-64 rounded-xl bg-white lg:col-span-2" />
                </div>
            )}

            {result && (
                <div className={cn("grid gap-6 lg:grid-cols-3 transition-opacity", isAnalyzing && "opacity-60")} aria-live="polite">
                    <Card className="border-none shadow-sm">
                        <CardContent className="flex flex-col items-center gap-5 pt-0 text-center">
                            <ScoreRing score={result.predicted_ctr_score} />
                            <p className="text-sm font-semibold leading-snug text-slate-800">{result.verdict}</p>
                            <div className="flex flex-wrap justify-center gap-2">
                                {result.cached && <Badge variant="secondary" className="bg-emerald-50 text-emerald-700">Cached · 0 tokens</Badge>}
                                {result.image_stats && !result.cached && (
                                    <Badge variant="secondary" className="bg-slate-100 text-slate-600">
                                        {Math.round(result.image_stats.originalBytes / 1024)}KB → {Math.round(result.image_stats.bytes / 1024)}KB
                                    </Badge>
                                )}
                            </div>
                            <ScoreBreakdown scores={result.scores} className="w-full text-left" />
                            <p className="text-[11px] leading-relaxed text-slate-400">Relative packaging strength for your niche, not a literal CTR %.</p>
                        </CardContent>
                    </Card>

                    <div className="space-y-6 lg:col-span-2">
                        <div className="grid gap-6 md:grid-cols-2">
                            <InsightList title="What's working" icon={LucideCheckCircle2} iconClass="text-emerald-500" items={result.strengths} />
                            <InsightList title="What's hurting clicks" icon={LucideXCircle} iconClass="text-red-500" items={result.weaknesses} />
                        </div>

                        <InsightList title="Edits to make before publishing" icon={LucideLightbulb} iconClass="text-brand" items={result.actionable_tips} />

                        {result.title_alternatives.length > 0 && (
                            <Card className="border-none shadow-sm">
                                <CardHeader>
                                    <CardTitle className="text-sm font-bold">Titles that pair better with this thumbnail</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    {result.title_alternatives.map((alt) => (
                                        <button
                                            key={alt}
                                            type="button"
                                            onClick={() => setTitle(alt)}
                                            className="group flex w-full items-center justify-between gap-3 rounded-lg border bg-slate-50 p-3 text-left text-sm font-medium text-slate-800 transition-colors hover:border-brand/40 hover:bg-brand-soft"
                                        >
                                            {alt}
                                            <span className="flex shrink-0 items-center gap-1 text-[11px] font-bold text-slate-400 group-hover:text-brand">
                                                <LucideCornerDownLeft className="h-3 w-3" /> Try it
                                            </span>
                                        </button>
                                    ))}
                                </CardContent>
                            </Card>
                        )}

                        {result.thumbnail_concepts.length > 0 && (
                            <div className="space-y-2 rounded-xl border border-violet-100 bg-violet-50/50 p-4">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-violet-700">Thumbnail concepts to A/B test</h4>
                                {result.thumbnail_concepts.map((concept) => (
                                    <p key={concept} className="rounded-lg border bg-white p-2.5 text-sm text-slate-700">{concept}</p>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {!result && !isAnalyzing && history.length === 0 && (
                <EmptyState
                    icon={LucideGauge}
                    tone="brand"
                    title="Grade before you publish"
                    description="Upload a draft thumbnail, write the title you're planning, and see how it holds up in a real mobile feed. Try two or three combos and ship the winner."
                />
            )}

            {history.length > 0 && (
                <Card className="border-none shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-sm font-bold">
                            <LucideHistory className="h-4 w-4 text-slate-400" /> Recent grades
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="divide-y">
                        {history.map((item) => {
                            const tone = scoreTone(item.score)
                            return (
                                <div key={item.id} className="flex items-center gap-4 py-3">
                                    <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-sm font-extrabold", tone.bg, tone.text)}>{item.score}</span>
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-semibold text-slate-900">{item.title}</p>
                                        <p className="truncate text-xs text-slate-500">{item.verdict}</p>
                                    </div>
                                    <span className="hidden shrink-0 text-xs text-slate-400 sm:block">
                                        {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                                    </span>
                                </div>
                            )
                        })}
                    </CardContent>
                </Card>
            )}
        </div>
    )
}

function InsightList({ title, icon: Icon, iconClass, items }: { title: string; icon: typeof LucideSparkles; iconClass: string; items: string[] }) {
    if (items.length === 0) return null
    return (
        <Card className="border-none shadow-sm">
            <CardHeader>
                <CardTitle className="text-sm font-bold">{title}</CardTitle>
            </CardHeader>
            <CardContent>
                <ul className="space-y-2">
                    {items.map((item) => (
                        <li key={item} className="flex items-start gap-2 text-sm text-slate-700">
                            <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", iconClass)} />
                            <span>{item}</span>
                        </li>
                    ))}
                </ul>
            </CardContent>
        </Card>
    )
}
