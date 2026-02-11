import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { LucideBarChart3, LucideTrendingUp, LucideMousePointer2, LucideTarget, LucideEye, LucideRefreshCw, LucideZap } from "lucide-react"
import Link from "next/link"

export default async function AnalyticsPage() {
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
                <h2 className="text-xl font-semibold">Connect a channel to see analytics</h2>
            </div>
        )
    }

    // 2. Get video aggregates
    const { data: videos } = await supabaseAdmin
        .from('videos')
        .select('view_count, like_count, comment_count')
        .eq('channel_id', channel.id)

    const totalViews = videos?.reduce((sum, v) => sum + (v.view_count || 0), 0) || 0
    const avgLikes = videos?.length ? (videos.reduce((sum, v) => sum + (v.like_count || 0), 0) / videos.length).toFixed(0) : 0

    return (
        <div className="space-y-10 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-extrabold tracking-tight text-[#0f172a]">Performance Intel</h1>
                    <p className="text-slate-500 text-lg font-medium">Deep technical analysis for <span className="text-[#0f172a] font-bold">{channel.channel_name}</span></p>
                </div>
                <Button variant="outline" className="h-11 px-6 border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50">
                    <LucideRefreshCw className="w-4 h-4 mr-2" />
                    Refresh Data
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Link href="/dashboard/analytics" className="block group">
                    <Card className="border-none shadow-sm bg-white overflow-hidden transition-all duration-300 group-hover:shadow-md group-hover:-translate-y-1">
                        <div className="h-1 bg-[#ff642d] w-full opacity-0 group-hover:opacity-100 transition-opacity" />
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em]">Aggregate Views</span>
                                <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center text-[#ff642d] group-hover:bg-[#ff642d] group-hover:text-white transition-colors">
                                    <LucideEye className="w-4 h-4" />
                                </div>
                            </div>
                            <div className="text-3xl font-extrabold text-[#0f172a] group-hover:text-[#ff642d] transition-colors">{totalViews?.toLocaleString()}</div>
                            <p className="text-[10px] text-green-600 font-bold uppercase tracking-widest mt-2">+12% velocity</p>
                        </CardContent>
                    </Card>
                </Link>

                <Link href="/dashboard/analytics" className="block group">
                    <Card className="border-none shadow-sm bg-white overflow-hidden transition-all duration-300 group-hover:shadow-md group-hover:-translate-y-1">
                        <div className="h-1 bg-blue-500 w-full opacity-0 group-hover:opacity-100 transition-opacity" />
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em]">Avg Engagement</span>
                                <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                    <LucideMousePointer2 className="w-4 h-4" />
                                </div>
                            </div>
                            <div className="text-3xl font-extrabold text-[#0f172a] group-hover:text-blue-600 transition-colors">{avgLikes?.toLocaleString()}</div>
                            <p className="text-[10px] text-slate-500 font-bold tracking-tighter mt-2 uppercase">Likes / Video</p>
                        </CardContent>
                    </Card>
                </Link>

                <Link href="/dashboard/seo/ranks" className="block group">
                    <Card className="border-none shadow-sm bg-white overflow-hidden transition-all duration-300 group-hover:shadow-md group-hover:-translate-y-1">
                        <div className="h-1 bg-green-500 w-full opacity-0 group-hover:opacity-100 transition-opacity" />
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em]">Niche Position</span>
                                <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center text-green-600 group-hover:bg-green-600 group-hover:text-white transition-colors">
                                    <LucideTarget className="w-4 h-4" />
                                </div>
                            </div>
                            <div className="text-3xl font-extrabold text-[#0f172a] group-hover:text-green-600 transition-colors">Top 15%</div>
                            <p className="text-[10px] text-slate-500 font-bold tracking-tighter mt-2 uppercase">In {channel.niche || 'Tech'}</p>
                        </CardContent>
                    </Card>
                </Link>

                <Link href="/dashboard/optimize" className="block group">
                    <Card className="border-none shadow-sm bg-[#0f172a] text-white overflow-hidden transition-all duration-300 group-hover:shadow-xl group-hover:shadow-[#0f172a]/20 group-hover:-translate-y-1">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em]">SEO Score</span>
                                <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center text-[#ff642d] group-hover:bg-[#ff642d] group-hover:text-white transition-colors">
                                    <LucideTrendingUp className="w-4 h-4" />
                                </div>
                            </div>
                            <div className="text-3xl font-extrabold group-hover:text-[#ff642d] transition-colors">84 / 100</div>
                            <div className="text-[10px] text-slate-400 font-bold mt-2 uppercase tracking-widest">Optimized</div>
                        </CardContent>
                    </Card>
                </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="h-[400px] flex flex-col items-center justify-center border-none shadow-sm bg-white overflow-hidden relative group">
                    <div className="absolute inset-0 bg-slate-50/50 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="text-center space-y-3 relative">
                        <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto text-slate-300">
                            <LucideBarChart3 className="w-8 h-8" />
                        </div>
                        <p className="text-[#0f172a] font-bold text-lg">Growth Velocity Charting</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">Requires 7 days of historical data</p>
                    </div>
                </Card>

                <div className="space-y-8">
                    <h2 className="text-xl font-bold text-[#0f172a]">Competitive Gaps</h2>
                    <Card className="bg-white border-none shadow-sm p-8 flex flex-col justify-center space-y-6 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-[#fff2ed] rounded-full -mr-16 -mt-16 blur-3xl opacity-50" />
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-red-50 rounded-xl text-[#ff642d]">
                                    <LucideZap className="w-5 h-5 fill-current" />
                                </div>
                                <h3 className="text-xl font-bold text-[#0f172a]">Smart Suggestion</h3>
                            </div>
                            <p className="text-slate-600 text-md leading-relaxed font-medium">
                                Videos with &quot;vs&quot; in the title are currently performing <span className="text-green-600 font-bold">40% better</span> across your niche competitors. Consider adding comparison videos to your schedule.
                            </p>
                        </div>
                        <Button asChild className="bg-[#ff642d] hover:bg-[#e85a28] w-full md:w-fit rounded-xl px-10 h-12 shadow-lg shadow-[#ff642d]/20 font-bold">
                            <Link href="/dashboard/seo/keywords">
                                View Recommended Topics
                            </Link>
                        </Button>
                    </Card>

                    <Card className="bg-[#0f172a] border-none shadow-sm p-6">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Niche Velocity</span>
                            <Badge className="bg-green-500/10 text-green-400 border-none">Stable</Badge>
                        </div>
                        <div className="flex items-baseline gap-2 mb-2">
                            <span className="text-2xl font-bold text-white">4.2k</span>
                            <span className="text-[10px] text-slate-500 font-bold uppercase">Searches / Day</span>
                        </div>
                        <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                            <div className="bg-[#ff642d] h-full w-[45%]" />
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    )
}

