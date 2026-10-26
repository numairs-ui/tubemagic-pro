"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { LucideSparkles, LucideZap, LucideLoader2, LucideTrendingUp, LucideArrowRight, LucideAlertTriangle } from "lucide-react"

interface Gap {
    topic: string
    search_volume_potential: "High" | "Medium" | "Low"
    competitor_proof: string
    strategy_tip: string
}

interface AnalysisResult {
    gaps: Gap[]
}

export default function TopicGapPage() {
    const [isLoading, setIsLoading] = useState(false)
    const [analysis, setAnalysis] = useState<AnalysisResult | null>(null)
    const [error, setError] = useState("")

    const runAnalysis = async () => {
        setIsLoading(true)
        setError("")
        try {
            const res = await fetch('/api/seo/topic-gap', { method: 'POST' })
            const data = await res.json()

            if (data.error) {
                setError(data.error)
            } else {
                setAnalysis(data)
            }
        } catch {
            setError("Failed to run analysis. Please try again.")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="space-y-8 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-extrabold tracking-tight text-ink">Topic Gap Analysis</h1>
                    <p className="text-slate-500 text-lg font-medium">AI-identified high velocity topics your competitors are winning with.</p>
                </div>
                {!analysis && (
                    <Button
                        size="lg"
                        onClick={runAnalysis}
                        disabled={isLoading}
                        className="bg-brand hover:bg-brand-hover text-white font-bold px-8 h-12 shadow-lg shadow-brand/20 rounded-xl"
                    >
                        {isLoading ? (
                            <>
                                <LucideLoader2 className="w-5 h-5 mr-2 animate-spin" />
                                Scanning Competitors...
                            </>
                        ) : (
                            <>
                                <LucideSparkles className="w-5 h-5 mr-2" />
                                Run Smart Scan
                            </>
                        )}
                    </Button>
                )}
            </div>

            {/* Error State */}
            {error && (
                <Card className="bg-red-50 border-red-100">
                    <CardContent className="pt-6 flex items-center gap-3 text-red-600 font-medium">
                        <LucideAlertTriangle className="w-5 h-5" />
                        {error}
                        {error.includes("competitors") && (
                            <Button variant="link" className="text-red-700 underline pl-2" asChild>
                                <a href="/dashboard">Add competitors on your channel page</a>
                            </Button>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Empty State / Intro */}
            {!analysis && !isLoading && !error && (
                <Card className="border-dashed border-2 py-16 bg-white/50">
                    <CardContent className="flex flex-col items-center justify-center text-center space-y-6">
                        <div className="w-20 h-20 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-500 mb-2">
                            <LucideZap className="w-10 h-10" />
                        </div>
                        <div className="space-y-2 max-w-lg">
                            <h3 className="text-xl font-bold text-slate-900">Discover Your Next Viral Hit</h3>
                            <p className="text-slate-500 leading-relaxed">
                                Our AI will analyze the top 150 videos from your competitors, compare them against your library, and identify high-performing topics you are missing out on.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Loading State */}
            {isLoading && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-48 bg-white rounded-xl border border-slate-100" />
                    ))}
                </div>
            )}

            {/* Results Grid */}
            {analysis && (
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <Badge variant="outline" className="text-brand border-brand/20 bg-brand-soft px-3 py-1 text-sm font-bold">
                            {analysis.gaps.length} Gaps Found
                        </Badge>
                        <Button
                            variant="ghost"
                            onClick={runAnalysis}
                            className="text-slate-400 hover:text-slate-600"
                        >
                            Run New Scan
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        {analysis.gaps.map((gap, i) => (
                            <Card key={i} className="border-none shadow-sm bg-white overflow-hidden hover:shadow-md transition-all duration-300 group">
                                <div className="h-1 bg-brand w-full opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="p-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
                                    {/* Topic & Potential */}
                                    <div className="lg:col-span-1 space-y-3">
                                        <div className="flex items-center gap-2">
                                            <Badge className={`
                                                ${gap.search_volume_potential === 'High' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}
                                                border-none font-bold uppercase tracking-wider text-[10px]
                                            `}>
                                                {gap.search_volume_potential} Potential
                                            </Badge>
                                        </div>
                                        <h3 className="text-lg font-bold text-slate-900 leading-tight">{gap.topic}</h3>
                                    </div>

                                    {/* Proof */}
                                    <div className="lg:col-span-1 border-l pl-6 border-slate-50">
                                        <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-2">Competitor Signal</p>
                                        <div className="flex items-start gap-2 text-sm text-slate-600 font-medium">
                                            <LucideTrendingUp className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                                            {gap.competitor_proof}
                                        </div>
                                    </div>

                                    {/* Strategy */}
                                    <div className="lg:col-span-2 border-l pl-6 border-slate-50 bg-slate-50/50 -my-6 py-6 flex flex-col justify-center">
                                        <p className="text-[10px] uppercase tracking-widest font-bold text-brand mb-2 flex items-center gap-1">
                                            <LucideSparkles className="w-3 h-3" /> AI Strategy Tip
                                        </p>
                                        <p className="text-sm text-slate-700 leading-relaxed font-medium italic">
                                            &quot;{gap.strategy_tip}&quot;
                                        </p>
                                        <div className="mt-4">
                                            <Button size="sm" className="bg-ink text-white hover:bg-slate-800 font-bold text-xs h-8">
                                                Create This Video <LucideArrowRight className="w-3 h-3 ml-1.5" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
