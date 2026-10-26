"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { PageHeader } from "@/components/ui/page-header"
import { EmptyState } from "@/components/ui/empty-state"
import { ScoreRing, scoreTone } from "@/components/ui/score-ring"
import PerformanceIndexChart, { type IndexPoint } from "@/components/charts/PerformanceIndexChart"
import {
    LucideActivity, LucideCheckCircle, LucideAlertCircle, LucideLoader2, LucideArrowRight, LucideRefreshCw,
    LucideTrendingUp, LucideTrendingDown, LucideCalendarClock, LucideGauge, LucideRocket,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface Issue {
    priority: "Critical" | "High" | "Medium" | "Low"
    check: string
    tip: string
}

interface AuditResult {
    score: number
    issues: Issue[]
    passed: string[]
    total_videos: number
    channel: { id: string; name: string }
    velocity: {
        medianViewsPerDay: number
        uploadCadenceDays: number | null
        daysSinceLastUpload: number | null
        momentumPct: number | null
        curveFitted: boolean
        revivalCount: number
        outliers: (IndexPoint & { youtubeVideoId: string })[]
        videos: IndexPoint[]
    }
}

const PRIORITY_STYLES: Record<Issue["priority"], string> = {
    Critical: "bg-red-600 text-white",
    High: "bg-orange-100 text-orange-800",
    Medium: "bg-amber-100 text-amber-800",
    Low: "bg-slate-100 text-slate-700",
}

// Where each failed check is fixed in the product.
const FIX_LINKS: Record<string, string> = {
    "Momentum": "/dashboard/packaging",
    "Packaging Consistency": "/dashboard/revival",
    "Title Length": "/dashboard/packaging",
    "Upload Cadence": "/dashboard/repurpose",
    "Consistency": "/dashboard/repurpose",
    "Search Intent": "/dashboard/seo/keywords",
}

export default function AuditPage() {
    const [isLoading, setIsLoading] = useState(false)
    const [audit, setAudit] = useState<AuditResult | null>(null)
    const [error, setError] = useState<{ message: string; code?: string } | null>(null)

    const runAudit = async () => {
        setIsLoading(true)
        setError(null)
        try {
            const res = await fetch('/api/seo/audit', { method: 'POST' })
            const data = await res.json()
            if (!res.ok) setError({ message: data.error || "Audit failed.", code: data.code })
            else setAudit(data)
        } catch {
            setError({ message: "Failed to run audit. Please try again." })
        } finally {
            setIsLoading(false)
        }
    }

    const v = audit?.velocity
    const momentumUp = (v?.momentumPct ?? 0) >= 0

    return (
        <div className="space-y-8 pb-20">
            <PageHeader
                eyebrow="Grow"
                title="Channel Velocity Audit"
                description="10 health checks plus momentum, cadence and per-video performance against your own baseline."
                actions={
                    <Button
                        onClick={runAudit}
                        disabled={isLoading}
                        className="h-11 rounded-xl bg-ink px-6 font-bold text-white shadow-lg hover:bg-slate-800"
                    >
                        {isLoading ? <LucideLoader2 className="h-4 w-4 animate-spin" /> : audit ? <LucideRefreshCw className="h-4 w-4" /> : <LucideActivity className="h-4 w-4" />}
                        {isLoading ? "Auditing…" : audit ? "Re-run audit" : "Run audit"}
                    </Button>
                }
            />

            {error && (
                <Card className="border-red-100 bg-red-50">
                    <CardContent className="flex flex-wrap items-center gap-3 font-medium text-red-700">
                        <LucideAlertCircle className="h-5 w-5" />
                        {error.message}
                        {(error.code === "no_channel" || error.code === "no_videos") && (
                            <Button variant="link" className="pl-0 text-red-700 underline" asChild>
                                <Link href="/dashboard/channels/connect">Connect a channel</Link>
                            </Button>
                        )}
                    </CardContent>
                </Card>
            )}

            {!audit && !isLoading && !error && (
                <EmptyState
                    icon={LucideGauge}
                    tone="green"
                    title="Is your channel gaining or losing speed?"
                    description="We fit a growth curve to your last 50 uploads, then score each video against what your channel normally gets at the same age, and run 10 health checks on cadence, packaging and metadata."
                    action={<Button onClick={runAudit} className="rounded-xl bg-brand font-bold hover:bg-brand-hover">Run my audit</Button>}
                />
            )}

            {isLoading && !audit && (
                <div className="grid animate-pulse grid-cols-1 gap-6 md:grid-cols-4">
                    {[0, 1, 2, 3].map((i) => <div key={i} className="h-28 rounded-xl bg-white" />)}
                    <div className="h-72 rounded-xl bg-white md:col-span-4" />
                </div>
            )}

            {audit && v && (
                <div className={cn("space-y-8 transition-opacity", isLoading && "opacity-60")}>
                    {/* Velocity tiles */}
                    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                        <Card className="border-none bg-ink text-white shadow-sm">
                            <CardContent className="flex items-center gap-4">
                                <ScoreRing score={audit.score} size={72} label="Health score" inverted />
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Health · {scoreTone(audit.score).label}</p>
                                    <p className="text-xs text-slate-300">{audit.passed.length}/10 checks passed</p>
                                </div>
                            </CardContent>
                        </Card>
                        <StatTile
                            label="Momentum"
                            value={v.momentumPct === null ? "–" : `${v.momentumPct > 0 ? "+" : ""}${v.momentumPct}%`}
                            hint={v.momentumPct === null ? "Needs more uploads" : "Latest 5 vs previous 10"}
                            icon={momentumUp ? LucideTrendingUp : LucideTrendingDown}
                            tone={v.momentumPct === null ? "slate" : momentumUp ? "green" : "red"}
                        />
                        <StatTile
                            label="Upload cadence"
                            value={v.uploadCadenceDays === null ? "–" : `${v.uploadCadenceDays}d`}
                            hint={v.daysSinceLastUpload === null ? "" : `Last upload ${Math.round(v.daysSinceLastUpload)}d ago`}
                            icon={LucideCalendarClock}
                            tone="slate"
                        />
                        <StatTile
                            label="Recent views / day"
                            value={v.medianViewsPerDay.toLocaleString()}
                            hint="Median of last 10 uploads"
                            icon={LucideActivity}
                            tone="slate"
                        />
                    </div>

                    {/* Chart */}
                    <Card className="border-none shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-lg font-bold">Every recent upload vs your baseline</CardTitle>
                            <CardDescription>
                                Views compared with what your channel typically has at the same age.
                                {!v.curveFitted && " Fewer than 5 videos: using a default growth curve until more data arrives."}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <PerformanceIndexChart videos={v.videos} />
                        </CardContent>
                    </Card>

                    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                        <div className="space-y-6 lg:col-span-2">
                            <Card className="border-none shadow-sm">
                                <CardHeader className="flex flex-row items-center justify-between border-b">
                                    <CardTitle className="text-lg font-bold">Action needed</CardTitle>
                                    <Badge variant="secondary" className="bg-red-50 font-bold text-red-600">{audit.issues.length} issues</Badge>
                                </CardHeader>
                                <CardContent className="p-0">
                                    {audit.issues.length > 0 ? (
                                        <div className="divide-y">
                                            {audit.issues.map((issue) => (
                                                <div key={issue.check} className="flex flex-col gap-3 p-5 transition-colors hover:bg-slate-50 md:flex-row md:items-start">
                                                    <Badge className={cn("shrink-0 border-none", PRIORITY_STYLES[issue.priority])}>{issue.priority}</Badge>
                                                    <div className="flex-1 space-y-1">
                                                        <h4 className="font-bold text-slate-900">{issue.check}</h4>
                                                        <p className="text-sm text-slate-600">{issue.tip}</p>
                                                    </div>
                                                    {FIX_LINKS[issue.check] && (
                                                        <Button size="sm" variant="ghost" className="shrink-0 self-start" asChild>
                                                            <Link href={FIX_LINKS[issue.check]}>Fix <LucideArrowRight className="h-4 w-4" /></Link>
                                                        </Button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="p-12 text-center text-slate-500">No issues found. Your channel is in great shape.</div>
                                    )}
                                </CardContent>
                            </Card>

                            <Card className="overflow-hidden border-none shadow-sm">
                                <div className="flex items-center gap-2 border-b border-green-50 bg-green-50/50 p-4 text-sm font-bold text-green-700">
                                    <LucideCheckCircle className="h-4 w-4" /> Passed checks ({audit.passed.length})
                                </div>
                                <div className="grid grid-cols-1 gap-3 p-6 md:grid-cols-2">
                                    {audit.passed.map((pass) => (
                                        <div key={pass} className="flex items-start gap-2 text-xs font-medium text-slate-600">
                                            <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-green-500" />
                                            {pass}
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        </div>

                        <div className="space-y-6">
                            <Card className="border-none shadow-sm">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-sm font-bold"><LucideRocket className="h-4 w-4 text-brand" /> Breakout videos</CardTitle>
                                    <CardDescription>2× or more above your baseline. Study and repeat these.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {v.outliers.length > 0 ? v.outliers.map((o) => (
                                        <div key={o.id} className="flex items-center justify-between gap-3">
                                            <p className="line-clamp-2 text-sm font-medium text-slate-800">{o.title}</p>
                                            <Badge className="shrink-0 border-none bg-blue-50 font-bold text-blue-700">{o.performanceIndex}×</Badge>
                                        </div>
                                    )) : <p className="text-sm text-slate-500">No breakouts in your recent uploads yet.</p>}
                                </CardContent>
                            </Card>

                            <Card className="border-none bg-brand-soft shadow-sm">
                                <CardContent className="space-y-3">
                                    <p className="text-sm font-bold text-slate-900">
                                        {v.revivalCount > 0 ? `${v.revivalCount} videos could be revived` : "No revival candidates right now"}
                                    </p>
                                    <p className="text-xs leading-relaxed text-slate-600">Older uploads that are decaying or underperforming for their age. A fresh title and thumbnail can restart their traffic.</p>
                                    <Button asChild size="sm" className="bg-brand font-bold hover:bg-brand-hover">
                                        <Link href="/dashboard/revival">Open Video Revival <LucideArrowRight className="h-4 w-4" /></Link>
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

function StatTile({ label, value, hint, icon: Icon, tone }: { label: string; value: string; hint: string; icon: typeof LucideActivity; tone: "green" | "red" | "slate" }) {
    const tones = { green: "bg-emerald-50 text-emerald-600", red: "bg-red-50 text-red-600", slate: "bg-slate-100 text-slate-500" }
    return (
        <Card className="border-none shadow-sm">
            <CardContent>
                <div className="mb-2 flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</span>
                    <span className={cn("flex h-7 w-7 items-center justify-center rounded-lg", tones[tone])}><Icon className="h-4 w-4" /></span>
                </div>
                <p className="text-2xl font-extrabold text-slate-900">{value}</p>
                <p className="mt-1 text-[11px] text-slate-500">{hint}</p>
            </CardContent>
        </Card>
    )
}
