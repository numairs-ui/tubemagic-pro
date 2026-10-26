"use client"

import { useState } from "react"
import { LucideImage, LucideMoon, LucideSun } from "lucide-react"
import { cn } from "@/lib/utils"

interface FeedPreviewProps {
    image: string | null
    title: string
    channelName?: string
    className?: string
}

/**
 * Renders the thumbnail + title the way a viewer meets it: a mobile home-feed
 * card at real size, in YouTube's light or dark theme, with 2-line title clamping.
 */
export default function FeedPreview({ image, title, channelName = "Your Channel", className }: FeedPreviewProps) {
    const [dark, setDark] = useState(false)
    const truncated = title.length > 70

    return (
        <div className={cn("space-y-3", className)}>
            <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Mobile feed preview</p>
                <div className="flex rounded-full border border-slate-200 bg-white p-0.5" role="group" aria-label="Feed theme">
                    <button
                        type="button"
                        onClick={() => setDark(false)}
                        aria-pressed={!dark}
                        className={cn("flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold transition-colors", !dark ? "bg-slate-900 text-white" : "text-slate-500 hover:text-slate-900")}
                    >
                        <LucideSun className="w-3 h-3" /> Light
                    </button>
                    <button
                        type="button"
                        onClick={() => setDark(true)}
                        aria-pressed={dark}
                        className={cn("flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold transition-colors", dark ? "bg-slate-900 text-white" : "text-slate-500 hover:text-slate-900")}
                    >
                        <LucideMoon className="w-3 h-3" /> Dark
                    </button>
                </div>
            </div>

            <div className={cn("mx-auto w-full max-w-[360px] rounded-2xl p-3 shadow-inner transition-colors duration-300", dark ? "bg-[#0f0f0f]" : "bg-white ring-1 ring-slate-200")}>
                <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-slate-200">
                    {image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={image} alt="Thumbnail preview" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                        <div className={cn("flex h-full w-full flex-col items-center justify-center gap-1 text-xs font-medium", dark ? "bg-[#272727] text-[#aaa]" : "bg-slate-100 text-slate-400")}>
                            <LucideImage className="w-6 h-6" />
                            Your thumbnail
                        </div>
                    )}
                    <span className="absolute bottom-1.5 right-1.5 rounded bg-black/80 px-1 py-0.5 font-mono text-[10px] font-medium text-white">12:34</span>
                </div>
                <div className="mt-3 flex gap-3">
                    <div className={cn("h-9 w-9 shrink-0 rounded-full", dark ? "bg-[#3f3f3f]" : "bg-slate-200")} />
                    <div className="min-w-0">
                        <p className={cn("line-clamp-2 text-[14px] font-medium leading-5", dark ? "text-[#f1f1f1]" : "text-[#0f0f0f]")}>
                            {title || "Your video title appears here"}
                        </p>
                        <p className={cn("mt-1 text-[12px]", dark ? "text-[#aaa]" : "text-[#606060]")}>
                            {channelName} · 12K views · 2 hours ago
                        </p>
                    </div>
                </div>
            </div>

            {truncated && (
                <p className="text-center text-[11px] font-medium text-amber-600">
                    {title.length} characters: the end of this title may be cut off on mobile.
                </p>
            )}
        </div>
    )
}
