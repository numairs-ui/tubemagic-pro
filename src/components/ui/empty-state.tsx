import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface EmptyStateProps {
    icon: LucideIcon
    title: string
    description: string
    action?: React.ReactNode
    tone?: "brand" | "blue" | "green" | "slate"
    className?: string
}

const tones = {
    brand: "bg-brand-soft text-brand",
    blue: "bg-blue-50 text-blue-600",
    green: "bg-emerald-50 text-emerald-600",
    slate: "bg-slate-100 text-slate-400",
}

export function EmptyState({ icon: Icon, title, description, action, tone = "slate", className }: EmptyStateProps) {
    return (
        <div className={cn("flex flex-col items-center justify-center text-center rounded-2xl border-2 border-dashed border-slate-200 bg-white/60 px-6 py-14", className)}>
            <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center mb-4", tones[tone])}>
                <Icon className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">{title}</h3>
            <p className="mt-1 max-w-md text-sm leading-relaxed text-slate-500">{description}</p>
            {action && <div className="mt-6">{action}</div>}
        </div>
    )
}
