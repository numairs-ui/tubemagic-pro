"use client"

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface RankChartProps {
    data: { day: string; rank: number }[]
}

export function RankChart({ data }: RankChartProps) {
    return (
        <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                    dataKey="day"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: '#94a3b8' }}
                    dy={10}
                />
                <YAxis
                    reversed
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: '#94a3b8' }}
                    dx={-10}
                />
                <Tooltip
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Line
                    type="monotone"
                    dataKey="rank"
                    stroke="#ff642d"
                    strokeWidth={4}
                    dot={{ r: 4, fill: "#ff642d", strokeWidth: 2, stroke: "#fff" }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                />
            </LineChart>
        </ResponsiveContainer>
    )
}
