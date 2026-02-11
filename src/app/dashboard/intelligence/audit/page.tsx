"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { LucideActivity, LucideCheckCircle, LucideAlertCircle, LucideLoader2, LucideArrowRight, LucideRefreshCw } from "lucide-react"
import Link from "next/link"

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
}

export default function AuditPage() {
    const [isLoading, setIsLoading] = useState(false)
    const [audit, setAudit] = useState<AuditResult | null>(null)
    const [error, setError] = useState("")

    const runAudit = async () => {
        setIsLoading(true)
        setError("")
        try {
            const res = await fetch('/api/seo/audit', { method: 'POST' })
            const data = await res.json()

            if (data.error) {
                setError(data.error)
            } else {
                setAudit(data)
            }
        } catch (err) {
            setError("Failed to run audit. Please try again.")
        } finally {
            setIsLoading(false)
        }
    }

    const getScoreColor = (score: number) => {
        if (score >= 80) return "text-green-500"
        if (score >= 50) return "text-yellow-500"
        return "text-red-500"
    }

    return (
        <div className="space-y-8 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-extrabold tracking-tight text-[#0f172a]">Channel Health</h1>
                    <p className="text-slate-500 text-lg font-medium">Technical SEO audit for your content library.</p>
                </div>
                {!audit && (
                    <Button
                        size="lg"
                        onClick={runAudit}
                        disabled={isLoading}
                        className="bg-[#0f172a] hover:bg-slate-800 text-white font-bold px-8 h-12 shadow-lg rounded-xl"
                    >
                        {isLoading ? (
                            <>
                                <LucideLoader2 className="w-5 h-5 mr-2 animate-spin" />
                                Auditing Channel...
                            </>
                        ) : (
                            <>
                                <LucideActivity className="w-5 h-5 mr-2" />
                                Start Check-up
                            </>
                        )}
                    </Button>
                )}
            </div>

            {/* Error State */}
            {error && (
                <Card className="bg-red-50 border-red-100">
                    <CardContent className="pt-6 flex items-center gap-3 text-red-600 font-medium">
                        <LucideAlertCircle className="w-5 h-5" />
                        {error}
                        {error.includes("videos") && (
                            <Button variant="link" className="text-red-700 underline pl-2" asChild>
                                <Link href="/dashboard/channels/connect">Connect Channel</Link>
                            </Button>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Empty State */}
            {!audit && !isLoading && !error && (
                <Card className="border-dashed border-2 py-16 bg-white/50">
                    <CardContent className="flex flex-col items-center justify-center text-center space-y-6">
                        <div className="w-20 h-20 bg-green-50 rounded-2xl flex items-center justify-center text-green-500 mb-2">
                            <LucideCheckCircle className="w-10 h-10" />
                        </div>
                        <div className="space-y-2 max-w-lg">
                            <h3 className="text-xl font-bold text-slate-900">Is your channel healthy?</h3>
                            <p className="text-slate-500 leading-relaxed">
                                We check 10 technical points across your last 50 videos including metadata, tags, engagement ratios, and upload consistency.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Loading State */}
            {isLoading && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
                    <div className="col-span-1 h-64 bg-white rounded-xl border border-slate-100" />
                    <div className="col-span-2 h-64 bg-white rounded-xl border border-slate-100" />
                </div>
            )}

            {/* Results */}
            {audit && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Score Card */}
                    <Card className="border-none shadow-sm bg-white overflow-hidden lg:col-span-1">
                        <CardHeader className="bg-slate-50/50 border-b">
                            <CardTitle>Health Score</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-10 pb-10 flex flex-col items-center justify-center space-y-6">
                            <div className="relative w-40 h-40 flex items-center justify-center">
                                {/* Simple circular indication using SVG if needed, but text is fine for MVP */}
                                <div className={`text-6xl font-extrabold ${getScoreColor(audit.score)}`}>
                                    {audit.score}
                                </div>
                                <div className="absolute -bottom-6 text-sm font-bold text-slate-400 uppercase tracking-widest">
                                    / 100 Points
                                </div>
                            </div>
                            <p className="text-center text-slate-500 font-medium px-4">
                                Based on {audit.total_videos} analyzed videos
                            </p>
                            <Button variant="outline" onClick={runAudit} className="w-full">
                                <LucideRefreshCw className="w-4 h-4 mr-2" /> Re-run Audit
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Report Card */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Issues */}
                        <Card className="border-none shadow-sm bg-white">
                            <CardHeader className="border-b flex flex-row items-center justify-between">
                                <CardTitle className="text-xl">Action Needed</CardTitle>
                                <Badge variant="secondary" className="bg-red-50 text-red-600 font-bold">{audit.issues.length} Issues</Badge>
                            </CardHeader>
                            <CardContent className="p-0">
                                {audit.issues.length > 0 ? (
                                    <div className="divide-y">
                                        {audit.issues.map((issue, i) => (
                                            <div key={i} className="p-6 flex flex-col md:flex-row gap-4 hover:bg-slate-50 transition-colors">
                                                <div className="shrink-0">
                                                    <Badge className={`
                                                        ${issue.priority === 'Critical' ? 'bg-red-500 hover:bg-red-600' :
                                                            issue.priority === 'High' ? 'bg-orange-500 hover:bg-orange-600' :
                                                                issue.priority === 'Medium' ? 'bg-yellow-500 hover:bg-yellow-600' :
                                                                    'bg-blue-500 hover:bg-blue-600'}
                                                    `}>
                                                        {issue.priority}
                                                    </Badge>
                                                </div>
                                                <div className="flex-1 space-y-1">
                                                    <h4 className="font-bold text-slate-900">{issue.check} Check Failed</h4>
                                                    <p className="text-slate-600 text-sm">{issue.tip}</p>
                                                </div>
                                                <Button size="sm" variant="ghost" className="shrink-0" asChild>
                                                    <a href="/dashboard/optimize">
                                                        Fix <LucideArrowRight className="w-4 h-4 ml-1" />
                                                    </a>
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-12 text-center text-slate-500">
                                        No critical issues found! Great job.
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Passed Checks */}
                        <Card className="border-none shadow-sm bg-white overflow-hidden">
                            <div className="p-4 bg-green-50/50 border-b border-green-50 flex items-center gap-2 text-green-700 font-bold text-sm">
                                <LucideCheckCircle className="w-4 h-4" /> Passed Checks ({audit.passed.length})
                            </div>
                            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-3">
                                {audit.passed.map((pass, i) => (
                                    <div key={i} className="flex items-start gap-2 text-xs text-slate-500 font-medium">
                                        <div className="w-1.5 h-1.5 rounded-full bg-green-400 mt-1.5 shrink-0" />
                                        {pass}
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </div>
                </div>
            )}
        </div>
    )
}
