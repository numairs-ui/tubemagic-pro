"use client"

import { Bar, BarChart, CartesianGrid, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { CHART, compactNumber } from "@/components/charts/chart-theme"

export interface IndexPoint {
    id: string
    title: string
    publishedAt: string
    views: number
    expectedViews: number
    performanceIndex: number
}

// Visual cap so one breakout video doesn't flatten every other bar.
const CAP = 300

interface Row extends IndexPoint {
    label: string
    pct: number
    display: number
}

function ChartTooltip({ active, payload }: { active?: boolean; payload?: { payload: Row }[] }) {
    if (!active || !payload?.[0]) return null
    const row = payload[0].payload
    const sign = row.pct >= 0 ? "+" : ""
    return (
        <div className="max-w-xs rounded-xl border bg-white p-3 text-xs shadow-lg">
            <p className="mb-1 line-clamp-2 font-bold text-slate-900">{row.title}</p>
            <p className="text-slate-600">
                <span className="font-bold text-slate-900">{sign}{row.pct}%</span> vs typical for its age
            </p>
            <p className="text-slate-500">{compactNumber(row.views)} views · expected ~{compactNumber(row.expectedViews)}</p>
        </div>
    )
}

/**
 * Each recent upload's views relative to what the channel typically gets at
 * the same age. Diverging: blue above the baseline, red below.
 */
export default function PerformanceIndexChart({ videos }: { videos: IndexPoint[] }) {
    const rows: Row[] = videos
        .slice(0, 20)
        .reverse() // oldest -> newest, left to right
        .map((v) => {
            const pct = Math.round((v.performanceIndex - 1) * 100)
            return {
                ...v,
                pct,
                display: Math.max(-100, Math.min(CAP, pct)),
                label: new Date(v.publishedAt).toLocaleDateString("en", { month: "short", day: "numeric" }),
            }
        })

    const above = rows.filter((r) => r.pct >= 0).length

    return (
        <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
                <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: CHART.above }} /> Above baseline ({above})</span>
                <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: CHART.below }} /> Below baseline ({rows.length - above})</span>
                <span className="text-slate-400">Bars capped at +{CAP}%; hover for exact values.</span>
            </div>
            <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={rows} margin={{ top: 8, right: 8, bottom: 0, left: -12 }} barCategoryGap={2}>
                        <CartesianGrid vertical={false} stroke={CHART.grid} strokeWidth={1} />
                        <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: CHART.axis }} interval="preserveStartEnd" minTickGap={16} />
                        <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: CHART.axis }} tickFormatter={(v: number) => `${v > 0 ? "+" : ""}${v}%`} />
                        <ReferenceLine y={0} stroke={CHART.reference} strokeWidth={1} />
                        <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(15,23,42,0.04)" }} />
                        <Bar dataKey="display" maxBarSize={24} radius={[4, 4, 4, 4]} isAnimationActive>
                            {rows.map((row) => (
                                <Cell key={row.id} fill={row.pct >= 0 ? CHART.above : CHART.below} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    )
}
