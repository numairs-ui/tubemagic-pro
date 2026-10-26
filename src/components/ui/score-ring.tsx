import { cn } from "@/lib/utils"

export function scoreTone(score: number) {
    if (score >= 75) return { label: "Strong", ring: "stroke-emerald-500", text: "text-emerald-600", bg: "bg-emerald-50", bar: "bg-emerald-500" }
    if (score >= 55) return { label: "Decent", ring: "stroke-amber-500", text: "text-amber-600", bg: "bg-amber-50", bar: "bg-amber-500" }
    return { label: "Weak", ring: "stroke-red-500", text: "text-red-600", bg: "bg-red-50", bar: "bg-red-500" }
}

interface ScoreRingProps {
    score: number
    size?: number
    label?: string
    /** Light text and track for use on dark surfaces. */
    inverted?: boolean
    className?: string
}

/** Radial 0-100 score. The tone label always accompanies the color. */
export function ScoreRing({ score, size = 140, label = "Packaging score", inverted = false, className }: ScoreRingProps) {
    const stroke = Math.max(8, Math.round(size / 14))
    const radius = (size - stroke) / 2
    const circumference = 2 * Math.PI * radius
    const clamped = Math.max(0, Math.min(100, score))
    const tone = scoreTone(clamped)

    return (
        <div className={cn("relative inline-flex items-center justify-center", className)} style={{ width: size, height: size }}>
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" role="img" aria-label={`${label}: ${clamped} out of 100, ${tone.label}`}>
                <circle cx={size / 2} cy={size / 2} r={radius} fill="none" strokeWidth={stroke} className={inverted ? "stroke-white/10" : "stroke-slate-100"} />
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    strokeWidth={stroke}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={circumference * (1 - clamped / 100)}
                    className={cn(tone.ring, "transition-[stroke-dashoffset] duration-1000 ease-out")}
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={cn("font-extrabold tracking-tight leading-none", inverted ? "text-white" : "text-slate-900")} style={{ fontSize: size * 0.3 }}>{clamped}</span>
                {size >= 96 && <span className={cn("mt-1 text-[10px] font-bold uppercase tracking-widest", tone.text)}>{tone.label}</span>}
            </div>
        </div>
    )
}
