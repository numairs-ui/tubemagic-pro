"use client"

import { UserButton } from "@clerk/nextjs"
import Link from "next/link"
import { LucideLayoutDashboard, LucideVideo, LucideZap, LucideSettings, LucideBarChart3, LucideSparkles, LucideActivity } from "lucide-react"
import { usePathname } from "next/navigation"

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const pathname = usePathname()

    const navItems = [
        { label: "Overview", href: "/dashboard", icon: LucideLayoutDashboard, active: pathname === "/dashboard" },
        {
            label: "SEO Suite",
            section: true,
            items: [
                { label: "Keyword Magic", href: "/dashboard/seo/keywords", icon: LucideVideo, active: pathname === "/dashboard/seo/keywords" },
                { label: "Rank Tracker", href: "/dashboard/seo/ranks", icon: LucideBarChart3, active: pathname === "/dashboard/seo/ranks" },
                { label: "Channel Audit", href: "/dashboard/intelligence/audit", icon: LucideActivity, active: pathname === "/dashboard/intelligence/audit" },
            ]
        },
        {
            label: "Intelligence",
            section: true,
            items: [
                { label: "AI Optimizer", href: "/dashboard/optimize", icon: LucideZap, active: pathname === "/dashboard/optimize" },
                { label: "Topic Gaps", href: "/dashboard/intelligence/topic-gap", icon: LucideSparkles, active: pathname === "/dashboard/intelligence/topic-gap" },
                { label: "Competitors", href: "/dashboard/analytics", icon: LucideBarChart3, active: pathname === "/dashboard/analytics" },
            ]
        },
        {
            label: "Account",
            section: true,
            items: [
                { label: "Settings", href: "/dashboard/settings", icon: LucideSettings, active: pathname === "/dashboard/settings" },
            ]
        }
    ]

    return (
        <div className="flex min-h-screen bg-slate-50">
            {/* Sidebar */}
            <aside className="w-64 border-r bg-white flex flex-col fixed inset-y-0">
                <div className="p-6 border-b">
                    <Link href="/dashboard" className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-[#ff642d] rounded-lg flex items-center justify-center shadow-lg shadow-[#ff642d]/20">
                            <LucideVideo className="text-white w-5 h-5" />
                        </div>
                        <span className="text-xl font-bold tracking-tight text-[#0f172a]">TubeMagic <span className="text-[#ff642d]">Pro</span></span>
                    </Link>
                </div>

                <nav className="flex-1 p-4 space-y-6 overflow-y-auto">
                    {navItems.map((item, idx) => (
                        <div key={idx} className="space-y-2">
                            {item.section ? (
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3">
                                    {item.label}
                                </p>
                            ) : null}

                            {item.items ? (
                                <div className="space-y-1">
                                    {item.items.map((sub) => (
                                        <Link
                                            key={sub.href}
                                            href={sub.href}
                                            className={`flex items-center space-x-3 px-3 py-2 text-sm font-medium rounded-md transition-colors ${sub.active
                                                ? "bg-[#fff2ed] text-[#ff642d]"
                                                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                                }`}
                                        >
                                            <sub.icon className={`w-4 h-4 ${sub.active ? "text-[#ff642d]" : ""}`} />
                                            <span>{sub.label}</span>
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                <Link
                                    href={item.href!}
                                    className={`flex items-center space-x-3 px-3 py-2 text-sm font-medium rounded-md transition-colors ${item.active
                                        ? "bg-[#fff2ed] text-[#ff642d]"
                                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                        }`}
                                >
                                    <item.icon className={`w-4 h-4 ${item.active ? "text-[#ff642d]" : ""}`} />
                                    <span>{item.label}</span>
                                </Link>
                            )}
                        </div>
                    ))}
                </nav>

                <div className="p-4 border-t flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <UserButton afterSignOutUrl="/" />
                        <div className="text-sm">
                            <p className="font-medium text-slate-900">Account</p>
                            <p className="text-slate-500 text-xs text-ellipsis overflow-hidden w-32">Manage Profile</p>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 ml-64 p-8">
                <div className="max-w-6xl mx-auto uppercase text-[10px] font-bold text-slate-400 tracking-[0.2em] mb-4">
                    Dashboard / {pathname.split('/').pop()?.replace('-', ' ') || 'Overview'}
                </div>
                <div className="max-w-6xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    )
}
