"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import {
    LucideArrowRight, LucideCheckCircle2, LucideLoader2, LucideLock, LucideSparkles,
    LucideUpload, LucideYoutube, LucideAlertCircle, LucideLightbulb, LucideXCircle, LucideMail,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScoreRing } from "@/components/ui/score-ring"
import ScoreBreakdown, { type PackagingScores } from "@/components/packaging/ScoreBreakdown"
import FeedPreview from "@/components/packaging/FeedPreview"
import ThumbnailDropzone from "@/components/packaging/ThumbnailDropzone"
import { extractVideoId } from "@/lib/youtube-url"
import { cn } from "@/lib/utils"

const NICHES = ["General", "Tech & Coding", "Finance & Investing", "Gaming", "Education", "Fitness & Health", "Business", "Lifestyle & Vlogs", "Beauty & Fashion", "Food & Cooking"]

interface Teaser {
    evaluation_id: string | null
    title: string
    predicted_ctr_score: number
    verdict: string
    scores: PackagingScores
    top_tip: string | null
    locked: Record<"strengths" | "weaknesses" | "actionable_tips" | "title_alternatives" | "thumbnail_concepts", number>
}

interface FullReport {
    strengths: string[]
    weaknesses: string[]
    actionable_tips: string[]
    title_alternatives: string[]
    thumbnail_concepts: string[]
}

export default function CtrGrader() {
    const [mode, setMode] = useState<"upload" | "youtube">("upload")
    const [image, setImage] = useState<string | null>(null)
    const [youtubeUrl, setYoutubeUrl] = useState("")
    const [title, setTitle] = useState("")
    const [niche, setNiche] = useState("General")
    const [isGrading, setIsGrading] = useState(false)
    const [teaser, setTeaser] = useState<Teaser | null>(null)
    const [report, setReport] = useState<FullReport | null>(null)
    const [email, setEmail] = useState("")
    const [isUnlocking, setIsUnlocking] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const videoId = useMemo(() => (youtubeUrl ? extractVideoId(youtubeUrl) : null), [youtubeUrl])
    const previewImage = mode === "upload" ? image : videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : null
    const canGrade = mode === "upload" ? Boolean(image && title.trim().length >= 3) : Boolean(videoId)

    const grade = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!canGrade) return
        setIsGrading(true)
        setError(null)
        setTeaser(null)
        setReport(null)
        try {
            const res = await fetch("/api/public/grade", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...(mode === "upload" ? { image } : { youtubeUrl }),
                    title: title.trim() || undefined,
                    niche: niche === "General" ? undefined : niche,
                }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || "Grading failed. Please try again.")
            setTeaser(data)
            if (!title.trim() && data.title) setTitle(data.title)
        } catch (err) {
            setError(err instanceof Error ? err.message : "Grading failed. Please try again.")
        } finally {
            setIsGrading(false)
        }
    }

    const unlock = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!teaser?.evaluation_id) return
        setIsUnlocking(true)
        setError(null)
        try {
            const res = await fetch("/api/public/unlock", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, evaluationId: teaser.evaluation_id }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || "Could not unlock the report.")
            setReport(data)
        } catch (err) {
            setError(err instanceof Error ? err.message : "Could not unlock the report.")
        } finally {
            setIsUnlocking(false)
        }
    }

    const lockedTotal = teaser ? Object.values(teaser.locked).reduce((s, n) => s + n, 0) : 0

    return (
        <div className="grid gap-6 lg:grid-cols-5">
            {/* Input */}
            <form onSubmit={grade} className="space-y-5 rounded-3xl bg-white p-5 text-slate-900 shadow-2xl shadow-black/20 ring-1 ring-slate-200 sm:p-7 lg:col-span-3">
                <div className="flex rounded-xl bg-slate-100 p-1" role="tablist" aria-label="Thumbnail source">
                    {([
                        { id: "upload", label: "Upload thumbnail", icon: LucideUpload },
                        { id: "youtube", label: "Paste YouTube link", icon: LucideYoutube },
                    ] as const).map((tab) => (
                        <button
                            key={tab.id}
                            type="button"
                            role="tab"
                            aria-selected={mode === tab.id}
                            onClick={() => setMode(tab.id)}
                            className={cn(
                                "flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-bold transition-all",
                                mode === tab.id ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"
                            )}
                        >
                            <tab.icon className="h-4 w-4" />
                            <span className="hidden sm:inline">{tab.label}</span>
                            <span className="sm:hidden">{tab.id === "upload" ? "Upload" : "Link"}</span>
                        </button>
                    ))}
                </div>

                {mode === "upload" ? (
                    <ThumbnailDropzone value={image} onChange={setImage} onError={setError} />
                ) : (
                    <div className="space-y-2">
                        <label htmlFor="grader-yt" className="text-xs font-bold uppercase tracking-wider text-slate-500">YouTube video link</label>
                        <input
                            id="grader-yt"
                            type="url"
                            inputMode="url"
                            value={youtubeUrl}
                            onChange={(e) => setYoutubeUrl(e.target.value)}
                            placeholder="https://youtube.com/watch?v=…"
                            className="w-full rounded-xl border border-slate-200 p-3 text-sm outline-none transition-shadow focus:ring-2 focus:ring-brand"
                        />
                        <p className="text-xs text-slate-400">Grade any public video: yours or a competitor&apos;s. We use its live thumbnail and title.</p>
                    </div>
                )}

                <div className="grid gap-4 sm:grid-cols-3">
                    <div className="space-y-2 sm:col-span-2">
                        <label htmlFor="grader-title" className="text-xs font-bold uppercase tracking-wider text-slate-500">
                            Title {mode === "youtube" && <span className="font-medium normal-case tracking-normal text-slate-400">(optional, test a new one)</span>}
                        </label>
                        <input
                            id="grader-title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            maxLength={120}
                            placeholder="I Tried Every AI Coding Tool So You Don't Have To"
                            className="w-full rounded-xl border border-slate-200 p-3 text-sm outline-none transition-shadow focus:ring-2 focus:ring-brand"
                        />
                    </div>
                    <div className="space-y-2">
                        <label htmlFor="grader-niche" className="text-xs font-bold uppercase tracking-wider text-slate-500">Niche</label>
                        <select
                            id="grader-niche"
                            value={niche}
                            onChange={(e) => setNiche(e.target.value)}
                            className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm outline-none focus:ring-2 focus:ring-brand"
                        >
                            {NICHES.map((n) => <option key={n}>{n}</option>)}
                        </select>
                    </div>
                </div>

                <Button
                    type="submit"
                    disabled={!canGrade || isGrading}
                    className="h-12 w-full rounded-xl bg-brand text-base font-bold shadow-lg shadow-brand/30 transition-transform hover:bg-brand-hover active:scale-[0.99]"
                >
                    {isGrading ? <><LucideLoader2 className="h-5 w-5 animate-spin" /> Grading like a viewer would…</> : <><LucideSparkles className="h-5 w-5" /> Grade my packaging free</>}
                </Button>
                <p className="text-center text-[11px] text-slate-400">3 free grades a day · no signup · scored by GPT-4o Vision</p>

                {error && (
                    <div className="flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-700" role="alert">
                        <LucideAlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                        <span>{error}</span>
                    </div>
                )}
            </form>

            {/* Preview & results */}
            <div className="space-y-5 rounded-3xl bg-white p-5 text-slate-900 shadow-2xl shadow-black/20 ring-1 ring-slate-200 sm:p-7 lg:col-span-2" aria-live="polite">
                {!teaser && !isGrading && <FeedPreview image={previewImage} title={title} />}

                {isGrading && (
                    <div className="flex h-full min-h-[320px] flex-col items-center justify-center gap-4 text-center">
                        <div className="h-24 w-24 animate-pulse rounded-full bg-brand-soft" />
                        <p className="text-sm font-medium text-slate-500">Checking contrast, focal point, curiosity and title synergy…</p>
                    </div>
                )}

                {teaser && (
                    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <div className="flex items-center gap-5">
                            <ScoreRing score={teaser.predicted_ctr_score} size={112} />
                            <div className="min-w-0 space-y-1">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Verdict</p>
                                <p className="text-sm font-semibold leading-snug text-slate-800">{teaser.verdict}</p>
                            </div>
                        </div>

                        <ScoreBreakdown scores={teaser.scores} />

                        {teaser.top_tip && (
                            <div className="flex gap-3 rounded-xl border border-brand/20 bg-brand-soft p-3">
                                <LucideLightbulb className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                                <p className="text-sm font-medium text-slate-800"><span className="font-bold">#1 fix:</span> {teaser.top_tip}</p>
                            </div>
                        )}

                        {!report ? (
                            <div className="relative overflow-hidden rounded-xl border border-slate-200">
                                <div className="pointer-events-none select-none space-y-2 p-4 blur-[3px]" aria-hidden>
                                    {["Crop tighter on the subject so it fills more of the frame", "Swap the overlay for a 2-word phrase in heavy type", "Try: The Tool Nobody Mentions (After 30 Days)"].map((line) => (
                                        <p key={line} className="text-sm text-slate-600">• {line}</p>
                                    ))}
                                </div>
                                <form onSubmit={unlock} className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-white/70 p-4 text-center backdrop-blur-[1px]">
                                    <p className="flex items-center gap-1.5 text-sm font-bold text-slate-900">
                                        <LucideLock className="h-4 w-4 text-brand" /> {lockedTotal} more insights, including {teaser.locked.title_alternatives} better titles
                                    </p>
                                    <div className="flex w-full max-w-sm gap-2">
                                        <input
                                            type="email"
                                            required
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="you@channel.com"
                                            aria-label="Email address"
                                            className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-brand"
                                        />
                                        <Button type="submit" disabled={isUnlocking || !teaser.evaluation_id} className="bg-slate-900 font-bold hover:bg-slate-800">
                                            {isUnlocking ? <LucideLoader2 className="h-4 w-4 animate-spin" /> : <LucideMail className="h-4 w-4" />}
                                            Unlock
                                        </Button>
                                    </div>
                                    <p className="text-[10px] text-slate-400">Get the full report. Occasional packaging tips, unsubscribe anytime.</p>
                                </form>
                            </div>
                        ) : (
                            <FullReportView report={report} />
                        )}

                        <div className="flex flex-col gap-2 border-t pt-4 sm:flex-row">
                            <Button asChild className="flex-1 bg-brand font-bold hover:bg-brand-hover">
                                <Link href="/sign-up">Grade before every upload <LucideArrowRight className="h-4 w-4" /></Link>
                            </Button>
                            <Button type="button" variant="outline" onClick={() => { setTeaser(null); setReport(null) }} className="font-bold">
                                Grade another
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

function FullReportView({ report }: { report: FullReport }) {
    return (
        <div className="space-y-4 animate-in fade-in duration-500">
            <ReportList icon={LucideCheckCircle2} iconClass="text-emerald-500" title="What's working" items={report.strengths} />
            <ReportList icon={LucideXCircle} iconClass="text-red-500" title="What's hurting clicks" items={report.weaknesses} />
            <ReportList icon={LucideLightbulb} iconClass="text-brand" title="Edits to make" items={report.actionable_tips} />
            {report.title_alternatives.length > 0 && (
                <div className="space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Titles that pair better</p>
                    {report.title_alternatives.map((t) => (
                        <p key={t} className="rounded-lg border bg-slate-50 p-2.5 text-sm font-semibold text-slate-800">{t}</p>
                    ))}
                </div>
            )}
            <ReportList icon={LucideSparkles} iconClass="text-violet-500" title="Thumbnail concepts to test" items={report.thumbnail_concepts} />
        </div>
    )
}

function ReportList({ icon: Icon, iconClass, title, items }: { icon: typeof LucideSparkles; iconClass: string; title: string; items: string[] }) {
    if (items.length === 0) return null
    return (
        <div className="space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{title}</p>
            <ul className="space-y-1.5">
                {items.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-slate-700">
                        <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", iconClass)} />
                        <span>{item}</span>
                    </li>
                ))}
            </ul>
        </div>
    )
}
