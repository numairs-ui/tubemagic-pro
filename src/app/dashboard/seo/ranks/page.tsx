import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { LucideTrendingUp, LucidePlus, LucideRefreshCw, LucideAward, LucideHistory } from "lucide-react"
import { Button } from "@/components/ui/button"
import { RankChart } from "@/components/dashboard/RankChart"
import Link from "next/link"

const mockData = [
    { day: 'Mon', rank: 12 },
    { day: 'Tue', rank: 11 },
    { day: 'Wed', rank: 13 },
    { day: 'Thu', rank: 8 },
    { day: 'Fri', rank: 5 },
    { day: 'Sat', rank: 4 },
    { day: 'Sun', rank: 3 },
]

export default async function RankTrackerPage() {
    const { userId } = await auth()
    if (!userId) redirect('/sign-in')

    // 1. Get user and their primary channel
    const { data: user } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('clerk_user_id', userId)
        .single()

    const { data: channel } = await supabaseAdmin
        .from('channels')
        .select('*')
        .eq('user_id', user?.id)
        .order('last_synced_at', { ascending: false })
        .limit(1)
        .single()

    if (!channel) {
        return (
            <div className="py-20 text-center">
                <h2 className="text-xl font-semibold">Connect a channel to see ranking data</h2>
            </div>
        )
    }

    return (
        <div className="space-y-8 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <img
                        src={channel.thumbnail_url}
                        alt={channel.channel_name}
                        referrerPolicy="no-referrer"
                        className="h-14 w-14 rounded-2xl border-2 border-white shadow-sm object-cover"
                    />
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-ink">Rank Tracker</h1>
                        <p className="text-slate-500 text-lg font-medium">
                            Monitoring <span className="text-ink font-bold">{channel.channel_name}</span> visibility
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="h-11 px-5 border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50">
                        <LucideRefreshCw className="w-4 h-4 mr-2" />
                        Sync Ranks
                    </Button>
                    <Button className="bg-brand hover:bg-brand-hover h-11 px-6 rounded-xl font-bold shadow-lg shadow-brand/20">
                        <LucidePlus className="w-4 h-4 mr-2" />
                        Track Keyword
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left: Main Chart */}
                <Card className="lg:col-span-2 border-none shadow-sm bg-white overflow-hidden">
                    <CardHeader className="border-b bg-slate-50/50">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-lg">Visibility Trend</CardTitle>
                                <CardDescription>Avg. rank for tracked high-value keywords</CardDescription>
                            </div>
                            <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200">+4 positions</Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6 h-[320px]">
                        <RankChart data={mockData} />
                    </CardContent>
                </Card>

                {/* Right: Quick Stats */}
                <div className="space-y-6">
                    <Card className="border-none shadow-sm bg-ink text-white">
                        <CardHeader className="pb-2">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Winners & Losers</span>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 bg-green-500/10 rounded flex items-center justify-center text-green-400">
                                        <LucideAward className="w-4 h-4" />
                                    </div>
                                    <span className="text-sm font-medium">Top 3 Rank</span>
                                </div>
                                <span className="font-bold">12 keywords</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 bg-blue-500/10 rounded flex items-center justify-center text-blue-400">
                                        <LucideTrendingUp className="w-4 h-4" />
                                    </div>
                                    <span className="text-sm font-medium">Improving</span>
                                </div>
                                <span className="font-bold">28 keywords</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-sm bg-white">
                        <CardHeader>
                            <CardTitle className="text-sm">Position Strategy</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="p-3 bg-slate-50 rounded-lg flex items-center gap-3">
                                <LucideHistory className="w-5 h-5 text-slate-400" />
                                <p className="text-xs text-slate-600 font-medium leading-normal">
                                    Your rank for &quot;Next.js 15&quot; dropped by 2 spots. Consider updating the video description with new tags.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Keyword Table */}
            <div className="space-y-4">
                <h2 className="text-xl font-bold text-ink">Active Tracking</h2>
                <div className="bg-white border-none shadow-sm rounded-xl overflow-hidden">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50 border-b">
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Keyword</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Current Position</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Change</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {[
                                { kw: "Next.js App Router Tutorial", pos: 3, change: "+1", color: "text-green-600", url: "https://youtube.com/results?search_query=nextjs+app+router+tutorial" },
                                { kw: "React Server Components Explained", pos: 8, change: "-2", color: "text-red-600", url: "https://youtube.com/results?search_query=react+server+components" },
                                { kw: "Tailwind CSS Layouts", pos: 1, change: "0", color: "text-slate-400", url: "https://youtube.com/results?search_query=tailwind+css+layouts" },
                                { kw: "Supabase Auth for Nextjs", pos: 12, change: "+5", color: "text-green-600", url: "https://youtube.com/results?search_query=supabase+auth+nextjs" },
                            ].map((row, i) => (
                                <tr key={i} className="group hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4 font-bold text-slate-700">{row.kw}</td>
                                    <td className="px-6 py-4 text-sm font-bold text-center">#{row.pos}</td>
                                    <td className={`px-6 py-4 text-xs font-bold text-center ${row.color}`}>{row.change}</td>
                                    <td className="px-6 py-4 text-right">
                                        <Button variant="ghost" size="sm" asChild className="h-8 px-3 text-slate-400 hover:text-brand hover:bg-brand-soft rounded-lg group-hover:opacity-100 opacity-0 transition-opacity">
                                            <Link href={row.url} target="_blank" className="flex items-center gap-2">
                                                <Badge variant="outline" className="text-[10px] border-inherit text-inherit uppercase tracking-widest cursor-pointer">
                                                    View Video
                                                </Badge>
                                            </Link>
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
