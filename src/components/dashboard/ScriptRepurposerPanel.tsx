"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LucideVideo, LucideSparkles, LucideLoader2, LucideCopy, LucideCheck, LucideLayers, LucideShare2, LucideMessageSquare, LucideAtSign, LucideInfo } from "lucide-react"

interface ScriptRepurposerPanelProps {
    niche?: string
    videos?: { id: string; title: string; description: string | null }[]
}

interface RepurposeResult {
    shorts_script: {
        title: string
        hook_0_3s: string
        body_script: string
        call_to_action: string
    }
    tiktok_hook_variations: string[]
    community_poll: {
        question: string
        options: string[]
    }
    twitter_thread: string[]
    transcript_truncated?: boolean
}

export default function ScriptRepurposerPanel({ niche = "General", videos = [] }: ScriptRepurposerPanelProps) {
    const [transcript, setTranscript] = useState("")
    const [videoTitle, setVideoTitle] = useState("")
    const [isGenerating, setIsGenerating] = useState(false)
    const [result, setResult] = useState<RepurposeResult | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [copiedKey, setCopiedKey] = useState<string | null>(null)

    const handleRepurpose = async () => {
        if (!transcript && !videoTitle) return
        setIsGenerating(true)
        setError(null)

        try {
            const res = await fetch("/api/ai/repurpose", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ transcript, videoTitle, niche }),
            })

            const data = await res.json()
            if (!res.ok) throw new Error(data.error || "Script generation failed")
            setResult(data)
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Script generation failed")
        } finally {
            setIsGenerating(false)
        }
    }

    const copyText = (text: string, key: string) => {
        navigator.clipboard.writeText(text).catch(() => setError("Copy failed. Select the text and copy it manually."))
        setCopiedKey(key)
        setTimeout(() => setCopiedKey(null), 2000)
    }

    return (
        <Card className="border-blue-100 shadow-xl shadow-blue-900/5 bg-white overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-white border-b border-blue-50">
                <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-md shadow-blue-600/20">
                        <LucideVideo className="text-white w-5 h-5" />
                    </div>
                    <div>
                        <CardTitle className="text-xl font-bold">Short-Form Script & Content Repurposer</CardTitle>
                        <CardDescription className="text-xs text-slate-500">
                            Turn long-form videos into viral Shorts, TikTok hooks, community polls, and X threads
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
                <div className="space-y-4">
                    {videos.length > 0 && (
                        <div className="space-y-2">
                            <label htmlFor="repurpose-video" className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Start from one of your videos</label>
                            <select
                                id="repurpose-video"
                                defaultValue=""
                                onChange={(e) => {
                                    const video = videos.find((v) => v.id === e.target.value)
                                    if (!video) return
                                    setVideoTitle(video.title)
                                    setTranscript(video.description || "")
                                }}
                                className="w-full p-3 border rounded-xl text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="" disabled>Choose a recent upload…</option>
                                {videos.map((v) => <option key={v.id} value={v.id}>{v.title}</option>)}
                            </select>
                            <p className="text-[11px] text-slate-400">Prefills the title and description. Paste the full transcript for the best scripts.</p>
                        </div>
                    )}
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Video Title / Key Concept</label>
                        <input
                            type="text"
                            value={videoTitle}
                            onChange={(e) => setVideoTitle(e.target.value)}
                            placeholder="e.g. How I built a $10k/mo SaaS with Next.js"
                            className="w-full p-3 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Video Transcript or Summary (Optional)</label>
                        <textarea
                            rows={6}
                            value={transcript}
                            onChange={(e) => setTranscript(e.target.value)}
                            placeholder="Paste video transcript or core bullet points..."
                            className="w-full p-3 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                        />
                    </div>

                    <Button
                        onClick={handleRepurpose}
                        disabled={isGenerating || (!transcript && !videoTitle)}
                        className="w-full bg-blue-600 hover:bg-blue-700 h-12 rounded-xl font-bold shadow-lg shadow-blue-600/20"
                    >
                        {isGenerating ? (
                            <>
                                <LucideLoader2 className="w-4 h-4 animate-spin mr-2" />
                                Generating Multi-Format Scripts...
                            </>
                        ) : (
                            <>
                                <LucideSparkles className="w-4 h-4 mr-2" />
                                Repurpose Content across Formats
                            </>
                        )}
                    </Button>
                </div>

                {error && (
                    <p className="text-xs text-red-600 bg-red-50 p-3 rounded-xl border border-red-100">{error}</p>
                )}

                {result && (
                    <div className="space-y-6 pt-4 border-t animate-in fade-in slide-in-from-bottom-2 duration-500">
                        {result.transcript_truncated && (
                            <p className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-100 p-3 rounded-xl">
                                <LucideInfo className="w-4 h-4 shrink-0" />
                                Long transcript: only the first ~12,000 characters were used to keep generation fast and affordable.
                            </p>
                        )}
                        {/* Shorts Script */}
                        <div className="p-4 bg-slate-50 rounded-2xl border space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <LucideLayers className="w-4 h-4 text-blue-600" />
                                    <h4 className="text-sm font-bold text-slate-900">YouTube Shorts / Reel Script</h4>
                                </div>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => copyText(`${result.shorts_script.hook_0_3s}\n\n${result.shorts_script.body_script}\n\n${result.shorts_script.call_to_action}`, 'shorts')}
                                >
                                    {copiedKey === 'shorts' ? <LucideCheck className="w-4 h-4 text-green-500" /> : <LucideCopy className="w-4 h-4 text-slate-400" />}
                                </Button>
                            </div>
                            <div className="space-y-2 text-xs">
                                <div className="bg-white p-3 rounded-xl border">
                                    <span className="font-bold text-blue-600 uppercase text-[10px]">Hook (0-3s):</span>
                                    <p className="text-slate-800 font-medium mt-0.5">{result.shorts_script.hook_0_3s}</p>
                                </div>
                                <div className="bg-white p-3 rounded-xl border">
                                    <span className="font-bold text-slate-500 uppercase text-[10px]">Body Script (30s):</span>
                                    <p className="text-slate-700 leading-relaxed mt-0.5 whitespace-pre-line">{result.shorts_script.body_script}</p>
                                </div>
                                <div className="bg-white p-3 rounded-xl border">
                                    <span className="font-bold text-green-600 uppercase text-[10px]">Call to Action:</span>
                                    <p className="text-slate-800 font-medium mt-0.5">{result.shorts_script.call_to_action}</p>
                                </div>
                            </div>
                        </div>

                        {/* TikTok Hook Variations */}
                        <div className="p-4 bg-blue-50/40 rounded-2xl border border-blue-100 space-y-3">
                            <div className="flex items-center gap-2">
                                <LucideShare2 className="w-4 h-4 text-blue-600" />
                                <h4 className="text-sm font-bold text-blue-950">TikTok / IG Reel Hook Openers</h4>
                            </div>
                            <ul className="space-y-2">
                                {result.tiktok_hook_variations.map((hook, i) => (
                                    <li key={i} className="text-xs bg-white p-2.5 rounded-xl border flex items-center justify-between">
                                        <span className="font-medium text-slate-800">🔥 &quot;{hook}&quot;</span>
                                        <button onClick={() => copyText(hook, `hook_${i}`)} className="text-slate-400 hover:text-slate-600">
                                            {copiedKey === `hook_${i}` ? <LucideCheck className="w-3.5 h-3.5 text-green-500" /> : <LucideCopy className="w-3.5 h-3.5" />}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Community Poll */}
                        <div className="p-4 bg-slate-50 rounded-2xl border space-y-3">
                            <div className="flex items-center gap-2">
                                <LucideMessageSquare className="w-4 h-4 text-slate-600" />
                                <h4 className="text-sm font-bold text-slate-900">Community Tab Poll Post</h4>
                            </div>
                            <div className="bg-white p-3 rounded-xl border space-y-2 text-xs">
                                <p className="font-bold text-slate-900">{result.community_poll.question}</p>
                                <div className="grid grid-cols-2 gap-2 pt-1">
                                    {result.community_poll.options.map((opt, i) => (
                                        <div key={i} className="p-2 bg-slate-50 border rounded-lg text-slate-700 text-center font-medium">
                                            {opt}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* X / Threads post */}
                        {result.twitter_thread.length > 0 && (
                            <div className="p-4 bg-slate-50 rounded-2xl border space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <LucideAtSign className="w-4 h-4 text-slate-600" />
                                        <h4 className="text-sm font-bold text-slate-900">X / Threads Post</h4>
                                    </div>
                                    <Button size="sm" variant="ghost" onClick={() => copyText(result.twitter_thread.join("\n\n"), 'thread')} aria-label="Copy thread">
                                        {copiedKey === 'thread' ? <LucideCheck className="w-4 h-4 text-green-500" /> : <LucideCopy className="w-4 h-4 text-slate-400" />}
                                    </Button>
                                </div>
                                <ol className="space-y-2">
                                    {result.twitter_thread.map((tweet, i) => (
                                        <li key={i} className="flex gap-3 bg-white p-3 rounded-xl border text-xs text-slate-700 leading-relaxed">
                                            <span className="font-mono font-bold text-slate-400">{i + 1}/{result.twitter_thread.length}</span>
                                            <span className="whitespace-pre-line">{tweet}</span>
                                        </li>
                                    ))}
                                </ol>
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
