"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LucideZap, LucideWand2, LucideLoader2, LucideCopy, LucideCheck, LucideSparkles } from "lucide-react"

interface OptimizationPanelProps {
    video: {
        title: string
        description: string
        tags: string[]
        channels: {
            niche: string | null
        }
    }
}

export default function OptimizationPanel({ video }: OptimizationPanelProps) {
    const [isGenerating, setIsGenerating] = useState(false)
    const [results, setResults] = useState<{ suggested_titles: string[]; reasoning: string } | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
    const [goal, setGoal] = useState("Higher CTR (Viral)")

    const handleGenerate = async () => {
        setIsGenerating(true)
        setError(null)
        setResults(null)

        try {
            const res = await fetch("/api/ai/optimize", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    videoTitle: video.title,
                    videoDescription: video.description,
                    videoTags: video.tags,
                    niche: video.channels.niche,
                    goal: goal,
                }),
            })

            const data = await res.json()
            if (data.error) throw new Error(data.error)
            setResults(data)
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "An unknown error occurred")
        } finally {
            setIsGenerating(false)
        }
    }

    const copyToClipboard = (text: string, index: number) => {
        navigator.clipboard.writeText(text)
        setCopiedIndex(index)
        setTimeout(() => setCopiedIndex(null), 2000)
    }

    return (
        <div className="space-y-6">
            <Card className="border-red-100 shadow-lg shadow-red-900/5">
                <CardHeader className="bg-red-50/50">
                    <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center shadow-lg shadow-red-600/20">
                            <LucideWand2 className="text-white w-4 h-4" />
                        </div>
                        <div>
                            <CardTitle className="text-lg">AI SEO Optimizer</CardTitle>
                            <CardDescription className="text-xs">GPT-4 Powered Analysis</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Target Niche</label>
                            <div className="p-3 bg-slate-50 border rounded-lg text-sm font-medium">
                                {video.channels.niche || "Software Engineering"}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Optimization Goal</label>
                            <select
                                value={goal}
                                onChange={(e) => setGoal(e.target.value)}
                                className="w-full p-2.5 bg-white border rounded-lg text-sm appearance-none focus:ring-2 focus:ring-red-500 outline-none"
                            >
                                <option>Higher CTR (Viral)</option>
                                <option>Search Ranking (SEO)</option>
                                <option>Technical Precision</option>
                            </select>
                        </div>
                    </div>

                    <Button
                        onClick={handleGenerate}
                        disabled={isGenerating}
                        className="w-full bg-red-600 hover:bg-red-700 shadow-lg shadow-red-600/20 h-12 text-md font-semibold"
                    >
                        {isGenerating ? (
                            <LucideLoader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                            <LucideZap className="w-4 h-4 mr-2 fill-current" />
                        )}
                        {isGenerating ? "Generating..." : "Generate Optimized SEO"}
                    </Button>

                    {error && <p className="text-xs text-red-600 text-center">{error}</p>}

                    <div className="pt-4 border-t space-y-4">
                        <p className="text-[10px] text-slate-400 text-center flex items-center justify-center gap-1 uppercase tracking-widest font-bold">
                            {results ? "Optimization Ready" : "Generated Suggestions"}
                        </p>

                        {results ? (
                            <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
                                <div className="space-y-2">
                                    <div className="text-[10px] font-bold text-slate-500 uppercase px-1">Suggested Titles</div>
                                    {results.suggested_titles.map((title: string, i: number) => (
                                        <div key={i} className="group relative p-3 bg-slate-50 border rounded-lg text-sm hover:border-red-200 transition-colors">
                                            {title}
                                            <button
                                                onClick={() => copyToClipboard(title, i)}
                                                className="absolute right-2 top-2 p-1 text-slate-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                {copiedIndex === i ? <LucideCheck className="w-3.5 h-3.5 text-green-600" /> : <LucideCopy className="w-3.5 h-3.5" />}
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-xl space-y-2">
                                    <div className="flex items-center gap-2 text-blue-700 font-bold text-[10px] uppercase">
                                        <LucideSparkles className="w-3 h-3" />
                                        AI Reasoning
                                    </div>
                                    <p className="text-xs text-blue-900 leading-relaxed italic">
                                        &quot;{results.reasoning}&quot;
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-3 opacity-40 grayscale pointer-events-none">
                                <div className="p-3 bg-slate-50 border rounded-lg space-y-2">
                                    <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                                    <div className="h-3 bg-slate-100 rounded w-1/2"></div>
                                </div>
                                <p className="text-center text-xs">Run optimizer to see results</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
