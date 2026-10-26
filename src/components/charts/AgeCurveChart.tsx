"use client"

import { CartesianGrid, ComposedChart, Line, ResponsiveContainer, Scatter, Tooltip, XAxis, YAxis } from "recharts"
import { CHART, compactNumber } from "@/components/charts/chart-theme"

interface VideoPoint {
    id: string
    title: string
    ageDays: number
    views: number
    performanceIndex: number
}

interface AgeCurveChartProps {
    videos: VideoPoint[]
    curve: { ageDays: number; expectedViews: number }[]
    candidateIds: Set<string> | string[]
}

function ChartTooltip({ active, payload }: { active?: boolean; payload?: { payload: Partial<VideoPoint> & { expectedViews?: number } }[] }) {
    const point = payload?.[0]?.payload
    if (!active || !point?.title) return null
    return (
        <div className="max-w-xs rounded-xl border bg-white p-3 text-xs shadow-lg">
            <p className="mb-1 line-clamp-2 font-bold text-slate-900">{point.title}</p>
            <p className="text-slate-600">{compactNumber(point.views ?? 0)} views at {Math.round(point.ageDays ?? 0)} days</p>
            <p className="text-slate-500">{Math.round((point.performanceIndex ?? 0) * 100)}% of typical for that age</p>
        </div>
    )
}

/**
 * Views vs age on log-log axes, against the channel's fitted "typical" curve.
 * Dots under the line are underperforming for their age; orange dots are
 * the revival candidates listed below the chart.
 */
export default function AgeCurveChart({ videos, curve, candidateIds }: AgeCurveChartProps) {
    const ids = candidateIds instanceof Set ? candidateIds : new Set(candidateIds)
    const plotted = videos.filter((v) => v.views > 0 && v.ageDays > 0)
    const regular = plotted.filter((v) => !ids.has(v.id))
    const candidates = plotted.filter((v) => ids.has(v.id))
    const curveData = curve.filter((p) => p.expectedViews > 0)

    return (
        <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
                <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ background: CHART.above }} /> Your videos</span>
                <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ background: CHART.highlight }} /> Revival candidates</span>
                <span className="flex items-center gap-1.5"><span className="h-0.5 w-4" style={{ background: CHART.reference }} /> Typical for your channel</span>
            </div>
            <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart margin={{ top: 8, right: 12, bottom: 16, left: -4 }}>
                        <CartesianGrid stroke={CHART.grid} strokeWidth={1} />
                        <XAxis
                            dataKey="ageDays"
                            type="number"
                            scale="log"
                            domain={["dataMin", "dataMax"]}
                            allowDataOverflow
                            tickLine={false}
                            axisLine={false}
                            tick={{ fontSize: 10, fill: CHART.axis }}
                            tickFormatter={(v: number) => `${Math.round(v)}d`}
                            label={{ value: "Age (days, log scale)", position: "insideBottom", offset: -10, fontSize: 10, fill: CHART.axis }}
                        />
                        <YAxis
                            dataKey="views"
                            type="number"
                            scale="log"
                            domain={["auto", "auto"]}
                            allowDataOverflow
                            tickLine={false}
                            axisLine={false}
                            tick={{ fontSize: 10, fill: CHART.axis }}
                            tickFormatter={(v: number) => compactNumber(v)}
                        />
                        <Tooltip content={<ChartTooltip />} cursor={false} />
                        <Line
                            data={curveData}
                            dataKey="expectedViews"
                            type="monotone"
                            stroke={CHART.reference}
                            strokeWidth={2}
                            dot={false}
                            activeDot={false}
                            isAnimationActive={false}
                            legendType="none"
                        />
                        <Scatter data={regular} fill={CHART.above} stroke={CHART.surface} strokeWidth={2} shape="circle" />
                        <Scatter data={candidates} fill={CHART.highlight} stroke={CHART.surface} strokeWidth={2} shape="circle" />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
        </div>
    )
}
