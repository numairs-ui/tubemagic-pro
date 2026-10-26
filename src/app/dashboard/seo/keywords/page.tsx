"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { LucideSearch, LucideZap, LucideTrendingUp, LucideTarget, LucideBarChart3, LucideLoader2, LucideArrowRight, LucideInfo } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

interface KeywordMetrics {
    volume: string
    difficulty: number
    intent: string
    analysis: string
}

interface RelatedKeyword {
    keyword: string
    volume: string
    difficulty: number
}

export default function KeywordMagicPage() {
    const [query, setQuery] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [results, setResults] = useState<{
        keyword: string
        metrics: KeywordMetrics
        related: RelatedKeyword[]
    } | null>(null)

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!query.trim()) return

        setIsLoading(true)
        try {
            const res = await fetch("/api/seo/keywords", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ query }),
            })
            const data = await res.json()
            setResults(data)
        } catch (err) {
            console.error("Search failed:", err)
        } finally {
            setIsLoading(false)
        }
    }

    const getDifficultyColor = (score: number) => {
        if (score < 30) return "text-green-600 bg-green-50 border-green-100"
        if (score < 70) return "text-yellow-600 bg-yellow-50 border-yellow-100"
        return "text-red-600 bg-red-50 border-red-100"
    }

    return (
        <div className="space-y-8 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-ink">Keyword Magic Tool</h1>
                    <p className="text-slate-500 text-lg font-medium">Deep YouTube search analytics & competitive difficulty.</p>
                </div>
                <form onSubmit={handleSearch} className="flex w-full md:w-auto gap-2">
                    <div className="relative flex-1 md:w-80">
                        <LucideSearch className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Enter keyword (e.g. Next.js Tutorial)"
                            className="pl-9 h-11 border-slate-200 focus:ring-brand focus:border-brand"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                        />
                    </div>
                    <Button type="submit" disabled={isLoading} className="bg-brand hover:bg-brand-hover h-11 px-6 shadow-lg shadow-brand/20">
                        {isLoading ? <LucideLoader2 className="w-4 h-4 animate-spin" /> : "Analyze"}
                    </Button>
                </form>
            </div>

            {!results && !isLoading && (
                <div className="py-20 flex flex-col items-center justify-center text-center space-y-6">
                    <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center">
                        <LucideTarget className="w-10 h-10 text-slate-300" />
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-xl font-bold text-slate-900">Start your keyword research</h3>
                        <p className="text-slate-500 max-w-sm mx-auto">Analyze search volume, competition difficulty, and user intent to find low-hanging fruit for your channel.</p>
                    </div>
                </div>
            )}

            {isLoading && (
                <div className="py-20 flex flex-col items-center justify-center space-y-4">
                    <LucideLoader2 className="w-10 h-10 animate-spin text-brand" />
                    <p className="text-slate-500 font-medium animate-pulse">Aggregating YouTube search data & AI Analysis...</p>
                </div>
            )}

            {results && !isLoading && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    {/* Main Metrics Bar */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <Card className="border-none shadow-sm bg-white">
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Search Volume</span>
                                    <LucideBarChart3 className="w-4 h-4 text-blue-500" />
                                </div>
                                <div className="text-3xl font-extrabold text-slate-900">{results.metrics.volume}</div>
                                <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-tighter">Searches / mo</p>
                            </CardContent>
                        </Card>

                        <Card className="border-none shadow-sm bg-white">
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Difficulty</span>
                                    <LucideTrendingUp className="w-4 h-4 text-brand" />
                                </div>
                                <div className="flex items-baseline gap-2">
                                    <div className="text-3xl font-extrabold text-slate-900">{results.metrics.difficulty}</div>
                                    <span className="text-sm font-bold text-slate-400">/ 100</span>
                                </div>
                                <div className={`inline-flex px-2 py-0.5 mt-2 rounded border text-[9px] font-bold uppercase tracking-widest ${getDifficultyColor(results.metrics.difficulty)}`}>
                                    {results.metrics.difficulty < 30 ? "Easy" : results.metrics.difficulty < 70 ? "Workable" : "Hard"}
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-none shadow-sm bg-white">
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">User Intent</span>
                                    <LucideZap className="w-4 h-4 text-yellow-500" />
                                </div>
                                <div className="text-3xl font-extrabold text-slate-900">{results.metrics.intent}</div>
                                <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-tighter">Content Orientation</p>
                            </CardContent>
                        </Card>

                        <Card className="border-none shadow-sm bg-ink text-white">
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Opportunity</span>
                                    <LucideTarget className="w-4 h-4 text-green-400" />
                                </div>
                                <div className="text-3xl font-extrabold">{100 - results.metrics.difficulty}%</div>
                                <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-tighter">Growth Potential</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* AI Analysis & Strategy */}
                    <Card className="border-none shadow-sm bg-white overflow-hidden">
                        <div className="h-1 bg-gradient-to-r from-brand to-blue-500" />
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-brand-soft rounded-lg flex items-center justify-center text-brand">
                                    <LucideInfo className="w-4 h-4" />
                                </div>
                                <CardTitle className="text-lg">SEO Strategy Analysis</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p className="text-slate-600 leading-relaxed font-medium">
                                &quot;{results.metrics.analysis}&quot;
                            </p>
                        </CardContent>
                    </Card>

                    {/* Related Keywords Magic Table */}
                    <div className="space-y-4">
                        <h2 className="text-xl font-bold text-ink flex items-center gap-2">
                            Related Keywords
                            <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-widest border-slate-200 text-slate-500 bg-white">
                                {results.related.length} Suggestions
                            </Badge>
                        </h2>

                        <div className="border rounded-xl bg-white shadow-sm overflow-hidden">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/80 border-b">
                                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Keyword</th>
                                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Volume</th>
                                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Difficulty</th>
                                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {results.related.map((item, i) => (
                                        <tr key={i} className="group border-b last:border-0 hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-slate-700">{item.keyword}</span>
                                                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5 group-hover:text-brand transition-colors cursor-pointer" onClick={() => setQuery(item.keyword)}>Analyze Trend</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right font-mono text-xs text-slate-500">{item.volume}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-center gap-2">
                                                    <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full transition-all duration-500 ${item.difficulty < 30 ? "bg-green-500" : item.difficulty < 70 ? "bg-yellow-500" : "bg-red-500"
                                                                }`}
                                                            style={{ width: `${item.difficulty}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-[10px] font-bold text-slate-500 w-6 text-right">{item.difficulty}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => {
                                                            setQuery(item.keyword)
                                                            window.scrollTo({ top: 0, behavior: 'smooth' })
                                                        }}
                                                        className="h-8 w-8 p-0 text-slate-400 hover:text-brand hover:bg-brand-soft group-hover:opacity-100 opacity-0 transition-all duration-300 rounded-lg"
                                                    >
                                                        <LucideArrowRight className="w-4 h-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 px-3 text-[10px] font-bold uppercase tracking-widest text-brand bg-brand-soft hover:bg-brand hover:text-white transition-all duration-300 rounded-lg group-hover:opacity-100 opacity-0"
                                                        asChild
                                                    >
                                                        <Link href="/dashboard/seo/ranks">
                                                            Track
                                                        </Link>
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
