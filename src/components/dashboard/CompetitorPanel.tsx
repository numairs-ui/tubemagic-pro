"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { LucideUsers, LucidePlus, LucideLoader2, LucideTrendingUp, LucideTrophy } from "lucide-react"
import { useRouter } from "next/navigation"
import Link from "next/link"

interface CompetitorPanelProps {
    channelId: string
    competitors: { id: string; competitor_name: string; added_at: string }[]
}

export default function CompetitorPanel({ channelId, competitors }: CompetitorPanelProps) {
    const router = useRouter()
    const [input, setInput] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!input.trim()) return

        setIsLoading(true)
        setError(null)

        try {
            const res = await fetch("/api/competitors/add", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ channelId, competitorInput: input }),
            })

            const data = await res.json()
            if (data.error) throw new Error(data.error)

            setInput("")
            router.refresh()
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "An unknown error occurred")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Competitor Monitoring</h2>
                <Badge variant="secondary" className="bg-blue-50 text-blue-700">Alpha</Badge>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                {/* Add Competitor Card */}
                <Card className="md:col-span-1 border-dashed">
                    <CardHeader>
                        <CardTitle className="text-sm">Track New Competitor</CardTitle>
                        <CardDescription className="text-xs">Paste a YouTube URL or @handle.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleAdd} className="space-y-3">
                            <Input
                                placeholder="https://youtube.com/@..."
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                disabled={isLoading}
                            />
                            <Button type="submit" className="w-full bg-slate-900" disabled={isLoading}>
                                {isLoading ? <LucideLoader2 className="w-4 h-4 animate-spin" /> : <LucidePlus className="w-4 h-4 mr-2" />}
                                Add Channel
                            </Button>
                            {error && <p className="text-[10px] text-red-600 font-medium">{error}</p>}
                        </form>
                    </CardContent>
                </Card>

                {/* Competitor List */}
                <div className="md:col-span-2 space-y-4">
                    {competitors.length > 0 ? (
                        <div className="grid gap-4 sm:grid-cols-2">
                            {competitors.map((comp) => (
                                <Card key={comp.id} className="relative overflow-hidden group">
                                    <CardContent className="p-4 flex items-center space-x-4">
                                        <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
                                            <LucideUsers className="w-5 h-5 text-slate-400" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-semibold text-sm truncate">{comp.competitor_name}</h3>
                                            <p className="text-[10px] text-slate-500">Tracking since {new Date(comp.added_at).toLocaleDateString()}</p>
                                        </div>
                                        <LucideTrophy className="w-4 h-4 text-amber-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </CardContent>
                                    <div className="bg-slate-50 px-4 py-2 border-t flex items-center justify-between text-[10px]">
                                        <span className="text-slate-500 uppercase tracking-wider font-bold">Status</span>
                                        <span className="text-green-600 font-bold">Included in topic-gap scans</span>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <Card className="h-full flex items-center justify-center bg-slate-50 border-none">
                            <div className="text-center py-8">
                                <LucideUsers className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                                <p className="text-sm text-slate-500">No competitors tracked yet.</p>
                            </div>
                        </Card>
                    )}
                </div>
            </div>

            {/* Gap analysis entry point */}
            <Card className="bg-slate-900 text-white overflow-hidden border-none">
                <CardContent className="p-6 flex flex-col md:flex-row md:items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                        <LucideTrendingUp className="w-5 h-5 text-green-400" />
                    </div>
                    <div className="flex-1 space-y-1">
                        <p className="font-bold">Competitor Gap Analysis</p>
                        <p className="text-xs text-slate-400 leading-relaxed">
                            {competitors.length > 0
                                ? `Compare your catalog with the top recent videos from ${competitors.length} tracked channel${competitors.length === 1 ? "" : "s"} to find topics you haven't covered.`
                                : "Track at least one competitor, then scan for topics that are working for them but missing from your channel."}
                        </p>
                    </div>
                    <Button asChild disabled={competitors.length === 0} className="bg-brand hover:bg-brand-hover font-bold shrink-0">
                        <Link href="/dashboard/intelligence/topic-gap">Run topic-gap scan</Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
}

function Badge({ children, className }: { children: React.ReactNode; className?: string; variant?: string }) {
    return (
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${className}`}>
            {children}
        </span>
    )
}
