"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { PageHeader } from "@/components/ui/page-header"
import { EmptyState } from "@/components/ui/empty-state"
import AgeCurveChart from "@/components/charts/AgeCurveChart"
import { compactNumber } from "@/components/charts/chart-theme"
import {
    LucideRefreshCcw, LucideLoader2, LucideAlertCircle, LucideSparkles, LucideTrendingDown, LucideCopy,
    LucideCheck, LucideHeartPulse, LucideInfo, LucidePlus, LucideChevronDown,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { ChannelVelocity, RevivalCandidate } from "@/lib/velocity"

interface VelocityResponse {
    channel: { id: string; name: string; niche: string | null; last_synced_at: string | null }
    velocity: ChannelVelocity
}

interface RevivalPackage {
    diagnosis: string
    new_titles: string[]
    thumbnail_direction: string
    description_opener: string
    pinned_comment: string
    distribution_plays: string[]
    cached: boolean
}

export default function RevivalPage() {
    const [data, setData] = useState<VelocityResponse | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<{ message: string; code?: string } | null>(null)
    const [isSyncing, setIsSyncing] = useState(false)
    const [syncNote, setSyncNote] = useState<string | null>(null)

    const load = async () => {
        try {
            const res = await fetch("/api/growth/velocity")
            const json = await res.json()
            if (!res.ok) setError({ message: json.error || "Could not load your channel.", code: json.code })
            else { setData(json); setError(null) }
        } catch {
            setError({ message: "Could not load your channel. Please refresh." })
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        load()
    }, [])

    const sync = async () => {
        if (!data) return
        setIsSyncing(true)
        setSyncNote(null)
        try {
            const res = await fetch("/api/channels/sync", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ channelId: data.channel.id }),
            })
            const json = await res.json()
            if (!res.ok) setSyncNote(json.error || "Sync failed.")
            else {
                setSyncNote(`Synced ${json.synced} videos. Decay detection improves with every sync.`)
                await load()
            }
        } catch {
            setSyncNote("Sync failed. Please try again.")
        } finally {
            setIsSyncing(false)
        }
    }

    const v = data?.velocity

    return (
        <div className="space-y-8 pb-20">
            <PageHeader
                eyebrow="Grow"
                title="Video Revival"
                description="Find older uploads that are fading or underperforming for their age, and repackage them to restart suggested traffic."
                actions={data && (
                    <Button onClick={sync} disabled={isSyncing} variant="outline" className="h-11 rounded-xl border-slate-200 bg-white font-bold">
                        {isSyncing ? <LucideLoader2 className="h-4 w-4 animate-spin" /> : <LucideRefreshCcw className="h-4 w-4" />}
                        Refresh stats
                    </Button>
                )}
            />

            {syncNote && (
                <p className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-600" role="status">
                    <LucideInfo className="h-4 w-4 shrink-0 text-slate-400" /> {syncNote}
                </p>
            )}

            {isLoading && (
                <div className="space-y-6 animate-pulse">
                    <div className="h-80 rounded-xl bg-white" />
                    <div className="h-40 rounded-xl bg-white" />
                </div>
            )}

            {error && (
                error.code === "no_channel" ? (
                    <EmptyState
                        icon={LucideHeartPulse}
                        tone="brand"
                        title="Connect a channel to find revival candidates"
                        description="We need your upload history to model how views normally grow on your channel."
                        action={<Button asChild className="rounded-xl bg-brand font-bold hover:bg-brand-hover"><Link href="/dashboard/channels/connect"><LucidePlus className="h-4 w-4" /> Connect channel</Link></Button>}
                    />
                ) : (
                    <Card className="border-red-100 bg-red-50">
                        <CardContent className="flex items-center gap-3 font-medium text-red-700">
                            <LucideAlertCircle className="h-5 w-5" /> {error.message}
                        </CardContent>
                    </Card>
                )
            )}

            {v && v.videoCount === 0 && (
                <EmptyState icon={LucideLoader2} title="Your videos are still syncing" description="Check back in a minute. Ingestion runs in the background after you connect a channel." />
            )}

            {v && v.videoCount > 0 && (
                <>
                    <Card className="border-none shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-lg font-bold">Where each video sits on your growth curve</CardTitle>
                            <CardDescription>
                                Dots below the line have fewer views than your channel usually gets at that age.
                                {data?.channel.last_synced_at && ` Stats updated ${formatDistanceToNow(new Date(data.channel.last_synced_at), { addSuffix: true })}.`}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <AgeCurveChart videos={v.videos} curve={v.curvePoints} candidateIds={v.revivalCandidates.map((c) => c.id)} />
                        </CardContent>
                    </Card>

                    {!v.hasSnapshotHistory && (
                        <p className="flex items-start gap-2 rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
                            <LucideInfo className="mt-0.5 h-4 w-4 shrink-0" />
                            <span>Showing age-adjusted underperformers. Refresh stats again in a few days to also detect <strong>decay</strong>: videos whose traffic is falling off faster than normal.</span>
                        </p>
                    )}

                    <section className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold text-ink">Revival candidates</h2>
                            <Badge variant="outline" className="border-slate-200 font-bold text-slate-500">{v.revivalCandidates.length}</Badge>
                        </div>
                        {v.revivalCandidates.length === 0 ? (
                            <EmptyState
                                icon={LucideHeartPulse}
                                tone="green"
                                title="Your catalog is healthy"
                                description="No video older than 30 days is significantly behind your channel's normal growth curve. Keep your packaging sharp in Packaging Studio."
                            />
                        ) : (
                            <div className="space-y-3">
                                {v.revivalCandidates.map((c) => <CandidateCard key={c.id} candidate={c} />)}
                            </div>
                        )}
                    </section>
                </>
            )}
        </div>
    )
}

function CandidateCard({ candidate }: { candidate: RevivalCandidate }) {
    const [isOpen, setIsOpen] = useState(false)
    const [pkg, setPkg] = useState<RevivalPackage | null>(null)
    const [isGenerating, setIsGenerating] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [copied, setCopied] = useState<string | null>(null)

    const generate = async () => {
        setIsOpen(true)
        if (pkg) return
        setIsGenerating(true)
        setError(null)
        try {
            const res = await fetch("/api/growth/revive", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ videoId: candidate.id, signal: candidate.signal }),
            })
            const json = await res.json()
            if (!res.ok) throw new Error(json.error || "Could not generate a revival plan.")
            setPkg(json)
        } catch (err) {
            setError(err instanceof Error ? err.message : "Could not generate a revival plan.")
        } finally {
            setIsGenerating(false)
        }
    }

    const copy = (text: string) => {
        navigator.clipboard.writeText(text).then(() => {
            setCopied(text)
            setTimeout(() => setCopied(null), 1500)
        }).catch(() => undefined)
    }

    return (
        <Card className="overflow-hidden border-none shadow-sm transition-shadow hover:shadow-md">
            <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
                {candidate.thumbnailUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={candidate.thumbnailUrl} alt="" referrerPolicy="no-referrer" className="aspect-video w-full rounded-lg object-cover sm:w-40" />
                )}
                <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                        <Badge className={cn("border-none font-bold", candidate.signal === "decaying" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-800")}>
                            <LucideTrendingDown className="h-3 w-3" /> {candidate.signal === "decaying" ? "Decaying" : "Underperforming"}
                        </Badge>
                        <span className="text-xs text-slate-400">{Math.round(candidate.ageDays)} days old · {compactNumber(candidate.views)} views</span>
                    </div>
                    <p className="line-clamp-2 font-bold text-slate-900">{candidate.title}</p>
                    <p className="text-xs leading-relaxed text-slate-500">{candidate.reason}</p>
                </div>
                <div className="flex shrink-0 flex-row items-center gap-3 sm:flex-col sm:items-end">
                    <div className="sm:text-right">
                        <p className="text-lg font-extrabold text-slate-900">~{compactNumber(candidate.opportunity)}</p>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">views/mo upside</p>
                    </div>
                    <Button size="sm" onClick={() => (isOpen && pkg ? setIsOpen(false) : generate())} className="bg-brand font-bold hover:bg-brand-hover">
                        {isGenerating ? <LucideLoader2 className="h-4 w-4 animate-spin" /> : pkg ? <LucideChevronDown className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")} /> : <LucideSparkles className="h-4 w-4" />}
                        {pkg ? (isOpen ? "Hide plan" : "Show plan") : "Revive it"}
                    </Button>
                </div>
            </div>

            {isOpen && (error || pkg || isGenerating) && (
                <div className="space-y-4 border-t bg-slate-50/60 p-5 animate-in fade-in slide-in-from-top-1 duration-300">
                    {isGenerating && <p className="text-sm text-slate-500">Drafting a repackage…</p>}
                    {error && <p className="text-sm text-red-600">{error}</p>}
                    {pkg && (
                        <div className="grid gap-5 md:grid-cols-2">
                            <div className="space-y-4">
                                <div>
                                    <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">Diagnosis</p>
                                    <p className="text-sm text-slate-700">{pkg.diagnosis}</p>
                                </div>
                                <div>
                                    <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">New titles</p>
                                    <div className="space-y-2">
                                        {pkg.new_titles.map((t) => (
                                            <button key={t} type="button" onClick={() => copy(t)} className="flex w-full items-center justify-between gap-2 rounded-lg border bg-white p-2.5 text-left text-sm font-semibold text-slate-800 hover:border-brand/40">
                                                {t}
                                                {copied === t ? <LucideCheck className="h-4 w-4 shrink-0 text-green-600" /> : <LucideCopy className="h-4 w-4 shrink-0 text-slate-300" />}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">Thumbnail brief</p>
                                    <p className="text-sm text-slate-700">{pkg.thumbnail_direction}</p>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">Description opener</p>
                                    <p className="whitespace-pre-line rounded-lg border bg-white p-2.5 text-sm text-slate-700">{pkg.description_opener}</p>
                                </div>
                                {pkg.pinned_comment && (
                                    <div>
                                        <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">Pinned comment</p>
                                        <p className="rounded-lg border bg-white p-2.5 text-sm text-slate-700">{pkg.pinned_comment}</p>
                                    </div>
                                )}
                                {pkg.distribution_plays.length > 0 && (
                                    <div>
                                        <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">Distribution plays</p>
                                        <ul className="list-disc space-y-1 pl-4 text-sm text-slate-700">
                                            {pkg.distribution_plays.map((d) => <li key={d}>{d}</li>)}
                                        </ul>
                                    </div>
                                )}
                                <Button asChild size="sm" variant="outline" className="font-bold">
                                    <Link href="/dashboard/packaging">Grade the new thumbnail in Packaging Studio</Link>
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </Card>
    )
}
