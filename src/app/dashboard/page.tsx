import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { LucidePlus, LucideTrendingUp, LucideEye, LucideUsers, LucideZap, LucideSearch, LucideBarChart3, LucideSparkles, LucideArrowRight } from 'lucide-react'
import Link from 'next/link'

export default async function DashboardPage() {
    const { userId } = await auth()
    if (!userId) redirect('/sign-in')

    // Get user data from Supabase
    const { data: user } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('clerk_user_id', userId)
        .single()

    // Get connected channels
    const { data: channels } = await supabaseAdmin
        .from('channels')
        .select('*')
        .eq('user_id', user?.id)

    // Calculate aggregates
    const totalSubscribers = channels?.reduce((sum, c) => sum + (c.subscriber_count || 0), 0) || 0
    const totalViews = channels?.reduce((sum, c) => sum + (c.total_views || 0), 0) || 0
    const seoScore = channels?.length ? 84 : 0

    return (
        <div className="space-y-10 pb-20">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-extrabold tracking-tight text-[#0f172a]">Channel Intelligence</h1>
                    <p className="text-slate-500 text-lg font-medium">Data-driven performance overview for your content empire.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" className="h-11 px-5 border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50">
                        <LucideTrendingUp className="w-4 h-4 mr-2" />
                        Export Report
                    </Button>
                    <Button asChild className="bg-[#ff642d] hover:bg-[#e85a28] shadow-xl shadow-[#ff642d]/20 h-11 px-6 rounded-xl font-bold">
                        <Link href="/dashboard/channels/connect">
                            <LucidePlus className="w-4 h-4 mr-2" />
                            Connect Channel
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Top Metrics Grid: High Density */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Link href="/dashboard/analytics" className="block group">
                    <Card className="border-none shadow-sm bg-white overflow-hidden transition-all duration-300 group-hover:shadow-md group-hover:-translate-y-1">
                        <div className="h-1 bg-blue-500 w-full opacity-0 group-hover:opacity-100 transition-opacity" />
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em]">Total Audience</span>
                                <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                    <LucideUsers className="w-4 h-4" />
                                </div>
                            </div>
                            <div className="text-3xl font-extrabold text-slate-900">{totalSubscribers.toLocaleString()}</div>
                            <div className="flex items-center gap-1.5 mt-2">
                                <div className="w-10 h-1 bg-blue-100 rounded-full overflow-hidden">
                                    <div className="bg-blue-500 h-full w-[65%]" />
                                </div>
                                <span className="text-[10px] text-blue-600 font-bold">+12.4%</span>
                            </div>
                        </CardContent>
                    </Card>
                </Link>

                <Link href="/dashboard/analytics" className="block group">
                    <Card className="border-none shadow-sm bg-white overflow-hidden transition-all duration-300 group-hover:shadow-md group-hover:-translate-y-1">
                        <div className="h-1 bg-[#ff642d] w-full opacity-0 group-hover:opacity-100 transition-opacity" />
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em]">Channel Reach</span>
                                <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center text-[#ff642d] group-hover:bg-[#ff642d] group-hover:text-white transition-colors">
                                    <LucideEye className="w-4 h-4" />
                                </div>
                            </div>
                            <div className="text-3xl font-extrabold text-slate-900">{totalViews.toLocaleString()}</div>
                            <div className="flex items-center gap-1.5 mt-2">
                                <div className="w-10 h-1 bg-red-100 rounded-full overflow-hidden">
                                    <div className="bg-[#ff642d] h-full w-[82%]" />
                                </div>
                                <span className="text-[10px] text-[#ff642d] font-bold">+5.2%</span>
                            </div>
                        </CardContent>
                    </Card>
                </Link>

                <Link href="/dashboard/seo/keywords" className="block group">
                    <Card className="border-none shadow-sm bg-[#0f172a] text-white overflow-hidden transition-all duration-300 group-hover:shadow-xl group-hover:shadow-[#0f172a]/20 group-hover:-translate-y-1">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em]">SEO Health Score</span>
                                <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center text-green-400 group-hover:bg-green-400 group-hover:text-[#0f172a] transition-colors">
                                    <LucideTrendingUp className="w-4 h-4" />
                                </div>
                            </div>
                            <div className="text-3xl font-extrabold text-white">{seoScore}%</div>
                            <div className="flex items-center gap-1.5 mt-2 text-green-400 text-[10px] font-bold uppercase tracking-widest">
                                Optimized
                            </div>
                        </CardContent>
                    </Card>
                </Link>

                <Link href="/dashboard/analytics" className="block group">
                    <Card className="border-none shadow-sm bg-white overflow-hidden transition-all duration-300 group-hover:shadow-md group-hover:-translate-y-1">
                        <div className="h-1 bg-purple-500 w-full opacity-0 group-hover:opacity-100 transition-opacity" />
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em]">Avg Velocity</span>
                                <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                                    <LucidePlus className="w-4 h-4" />
                                </div>
                            </div>
                            <div className="text-3xl font-extrabold text-slate-900">1.4k</div>
                            <div className="text-[10px] text-slate-400 font-bold mt-2 uppercase">Views / Hour</div>
                        </CardContent>
                    </Card>
                </Link>
            </div>

            {/* Main Dashboard Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left: Active Channels & Videos */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-[#0f172a] flex items-center gap-2">
                            Connected Sources
                            <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-widest text-slate-400 border-slate-200">{channels?.length || 0}</Badge>
                        </h2>
                    </div>

                    {channels && channels.length > 0 ? (
                        <div className="grid grid-cols-1 gap-4">
                            {channels.map((channel) => (
                                <Card key={channel.id} className="border-none shadow-sm bg-white hover:shadow-md transition-all duration-300 overflow-hidden group">
                                    <div className="flex flex-col md:flex-row items-center p-4 gap-6">
                                        <div className="relative">
                                            <img
                                                src={channel.thumbnail_url}
                                                alt={channel.channel_name}
                                                referrerPolicy="no-referrer"
                                                className="h-16 w-16 rounded-2xl border-2 border-slate-50 shadow-sm object-cover group-hover:scale-105 transition-transform"
                                            />
                                            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                                                <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                                            </div>
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-lg font-bold text-slate-900">{channel.channel_name}</h3>
                                                <Badge variant="secondary" className="text-[9px] font-bold uppercase bg-slate-100 text-slate-500 py-0">{channel.niche || "General"}</Badge>
                                            </div>
                                            <div className="flex items-center gap-3 text-xs text-slate-400 font-medium">
                                                <span className="flex items-center gap-1"><LucideUsers className="w-3 h-3" /> {channel.subscriber_count?.toLocaleString()} Subscribers</span>
                                                <span className="w-1 h-1 bg-slate-200 rounded-full" />
                                                <span className="flex items-center gap-1"><LucideEye className="w-3 h-3" /> {channel.total_views?.toLocaleString()} Views</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button variant="outline" size="sm" asChild className="h-9 border-slate-200 text-slate-600 font-bold hover:bg-slate-50">
                                                <Link href={`/dashboard/analytics`}>
                                                    Quick Audit
                                                </Link>
                                            </Button>
                                            <Button size="sm" className="h-9 bg-[#ff642d] text-white rounded-lg hover:bg-[#e85a28] shadow-lg shadow-[#ff642d]/10 font-bold" asChild>
                                                <Link href="/dashboard/optimize">Optimize</Link>
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="h-1 w-full bg-slate-50 group-hover:bg-[#fff2ed] transition-colors" />
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <Card className="border-dashed border-2 py-16 bg-white/50">
                            <CardContent className="flex flex-col items-center justify-center text-center space-y-4">
                                <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-300">
                                    <LucidePlus className="w-8 h-8" />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-lg font-bold text-slate-900">No channels synced</h3>
                                    <p className="text-slate-500 max-w-sm mx-auto text-sm leading-relaxed">
                                        Connect your YouTube creator account to start ingesting historical data and AI-precision metrics.
                                    </p>
                                </div>
                                <Button asChild className="bg-[#ff642d] hover:bg-[#e85a28] px-10 rounded-xl h-12 shadow-lg shadow-[#ff642d]/20 font-bold">
                                    <Link href="/dashboard/channels/connect">Connect Now</Link>
                                </Button>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Right Column: AI Insights & Quick Actions */}
                <div className="space-y-8">
                    <h2 className="text-xl font-bold text-[#0f172a]">Live Insights</h2>
                    <Card className="border-none shadow-sm bg-white overflow-hidden relative group">
                        <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <LucideSparkles className="w-4 h-4 text-[#ff642d]" />
                        </div>
                        <div className="p-6 space-y-6">
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center text-[#ff642d]">
                                        <LucideZap className="w-5 h-5 fill-current" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Immediate Action</p>
                                        <p className="text-sm font-bold text-slate-900">Content Gap Alert</p>
                                    </div>
                                </div>
                                <p className="text-xs text-slate-600 leading-relaxed font-medium bg-slate-50 p-3 rounded-lg border border-slate-100 italic">
                                    &quot;Trending topics in your category have shifted towards &apos;Comparison&apos; videos. Your last Comparison video had <span className="text-[#ff642d] font-bold">45% higher retention</span>.&quot;
                                </p>
                            </div>
                            <Button className="w-full bg-[#ff642d] hover:bg-[#e85a28] font-bold h-11 rounded-xl shadow-lg shadow-[#ff642d]/10" asChild>
                                <Link href="/dashboard/optimize">Open Optimizer</Link>
                            </Button>
                        </div>
                    </Card>

                    <Card className="border-none shadow-sm bg-white p-6 space-y-4">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">Quick Shortcuts</p>
                        <div className="grid grid-cols-2 gap-3">
                            <Link href="/dashboard/seo/keywords" className="p-3 border border-slate-100 rounded-xl hover:border-[#ff642d]/30 hover:bg-[#fff2ed]/50 transition-all group">
                                <LucideSearch className="w-5 h-5 text-slate-400 group-hover:text-[#ff642d] mb-2" />
                                <span className="text-xs font-bold text-slate-700 block">Keywords</span>
                            </Link>
                            <Link href="/dashboard/seo/ranks" className="p-3 border border-slate-100 rounded-xl hover:border-[#ff642d]/30 hover:bg-[#fff2ed]/50 transition-all group">
                                <LucideBarChart3 className="w-5 h-5 text-slate-400 group-hover:text-[#ff642d] mb-2" />
                                <span className="text-xs font-bold text-slate-700 block">Track Ranks</span>
                            </Link>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    )
}
