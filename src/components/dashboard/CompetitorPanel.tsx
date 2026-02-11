"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { LucideUsers, LucidePlus, LucideLoader2, LucideTrendingUp, LucideTrophy } from "lucide-react"
import { useRouter } from "next/navigation"

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
                                        <span className="text-slate-500 uppercase tracking-wider font-bold">Niche Match</span>
                                        <span className="text-green-600 font-bold">High (92%)</span>
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

            {/* Analytics Preview */}
            <Card className="bg-slate-900 text-white overflow-hidden">
                <CardHeader className="border-b border-slate-800">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-md flex items-center gap-2">
                            <LucideTrendingUp className="w-4 h-4 text-green-400" />
                            Competitor Gap Analysis
                        </CardTitle>
                        <span className="text-[10px] font-mono text-slate-400">UPDATED 1H AGO</span>
                    </div>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="grid gap-8 md:grid-cols-2">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <div className="flex justify-between text-xs">
                                    <span className="text-slate-400">Release Frequency</span>
                                    <span className="text-red-400">-12% vs Competitors</span>
                                </div>
                                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-red-400 w-[60%]" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between text-xs">
                                    <span className="text-slate-400">SEO Quality Score</span>
                                    <span className="text-green-400">+8% vs Competitors</span>
                                </div>
                                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-green-400 w-[85%]" />
                                </div>
                            </div>
                        </div>
                        <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700 space-y-2">
                            <h4 className="text-xs font-bold text-amber-400 uppercase tracking-widest">AI Opportunity</h4>
                            <p className="text-xs text-slate-300 leading-relaxed">
                                Your competitors are seeing 2.4x more engagement on <span className="text-white font-medium">&quot;System Design&quot;</span> topics. We recommend prioritizing these ideas in your next release.
                            </p>
                        </div>
                    </div>
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
