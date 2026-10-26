import { scoreTone } from "@/components/ui/score-ring"
import { cn } from "@/lib/utils"

export interface PackagingScores {
    contrast: number
    readability: number
    curiosity: number
    synergy: number
    focal_point: number
}

const DIMENSIONS: { key: keyof PackagingScores; label: string; hint: string }[] = [
    { key: "contrast", label: "Feed contrast", hint: "Pops against light and dark feeds" },
    { key: "focal_point", label: "Focal point", hint: "One clear subject in half a second" },
    { key: "readability", label: "Mobile readability", hint: "Text legible at phone size" },
    { key: "curiosity", label: "Curiosity gap", hint: "Opens a question worth clicking" },
    { key: "synergy", label: "Title synergy", hint: "Title and image add up, not repeat" },
]

/** Five sub-scores as labelled meters; the value is always printed next to its bar. */
export default function ScoreBreakdown({ scores, className }: { scores: PackagingScores; className?: string }) {
    return (
        <ul className={cn("space-y-3", className)}>
            {DIMENSIONS.map(({ key, label, hint }) => {
                const value = scores[key]
                const tone = scoreTone(value)
                return (
                    <li key={key} title={hint}>
                        <div className="mb-1 flex items-baseline justify-between gap-2">
                            <span className="text-xs font-bold text-slate-700">{label}</span>
                            <span className="text-xs font-bold tabular-nums text-slate-900">{value}</span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                            <div
                                className={cn("h-full rounded-full transition-[width] duration-700 ease-out", tone.bar)}
                                style={{ width: `${value}%` }}
                            />
                        </div>
                    </li>
                )
            })}
        </ul>
    )
}
