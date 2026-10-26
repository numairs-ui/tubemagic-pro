"use client"

import { UserButton } from "@clerk/nextjs"
import Link from "next/link"
import { useState } from "react"
import { usePathname } from "next/navigation"
import {
    LucideLayoutDashboard, LucideSettings, LucideBarChart3, LucideSparkles, LucideActivity,
    LucideImage, LucideLayers, LucideRefreshCcw, LucideSearch, LucideWand2, LucideMenu, LucideX, LucideZap,
    type LucideIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface NavItem {
    label: string
    href: string
    icon: LucideIcon
    badge?: string
}

interface NavSection {
    label?: string
    items: NavItem[]
}

// Packaging and Repurposing are the primary workflows, so they sit directly
// under Overview. Growth diagnostics come next; legacy SEO tools last.
const NAV: NavSection[] = [
    { items: [{ label: "Overview", href: "/dashboard", icon: LucideLayoutDashboard }] },
    {
        label: "Create",
        items: [
            { label: "Packaging Studio", href: "/dashboard/packaging", icon: LucideImage, badge: "CTR" },
            { label: "Repurposing Studio", href: "/dashboard/repurpose", icon: LucideLayers },
        ],
    },
    {
        label: "Grow",
        items: [
            { label: "Velocity Audit", href: "/dashboard/intelligence/audit", icon: LucideActivity },
            { label: "Video Revival", href: "/dashboard/revival", icon: LucideRefreshCcw },
            { label: "Topic Gaps", href: "/dashboard/intelligence/topic-gap", icon: LucideSparkles },
            { label: "Performance", href: "/dashboard/analytics", icon: LucideBarChart3 },
        ],
    },
    {
        label: "SEO Toolkit",
        items: [
            { label: "Title Optimizer", href: "/dashboard/optimize", icon: LucideWand2 },
            { label: "Keyword Magic", href: "/dashboard/seo/keywords", icon: LucideSearch },
            { label: "Rank Tracker", href: "/dashboard/seo/ranks", icon: LucideBarChart3 },
        ],
    },
    { label: "Account", items: [{ label: "Settings", href: "/dashboard/settings", icon: LucideSettings }] },
]

function isActive(pathname: string, href: string) {
    return href === "/dashboard" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`)
}

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const pathname = usePathname()
    const [mobileOpen, setMobileOpen] = useState(false)

    const currentLabel = NAV.flatMap((s) => s.items).find((i) => isActive(pathname, i.href))?.label || "Dashboard"

    const sidebar = (
        <>
            <div className="flex h-16 items-center justify-between border-b px-5">
                <Link href="/dashboard" className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand shadow-lg shadow-brand/20">
                        <LucideZap className="h-4 w-4 fill-white text-white" />
                    </div>
                    <span className="text-lg font-bold tracking-tight text-ink">TubeMagic <span className="text-brand">Velocity</span></span>
                </Link>
                <button className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 lg:hidden" onClick={() => setMobileOpen(false)} aria-label="Close menu">
                    <LucideX className="h-5 w-5" />
                </button>
            </div>

            <nav className="flex-1 space-y-6 overflow-y-auto p-4" aria-label="Dashboard">
                {NAV.map((section, idx) => (
                    <div key={idx} className="space-y-1">
                        {section.label && (
                            <p className="px-3 pb-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">{section.label}</p>
                        )}
                        {section.items.map((item) => {
                            const active = isActive(pathname, item.href)
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    aria-current={active ? "page" : undefined}
                                    onClick={() => setMobileOpen(false)}
                                    className={cn(
                                        "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all",
                                        active ? "bg-brand-soft text-brand" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                    )}
                                >
                                    <item.icon className={cn("h-4 w-4 transition-transform group-hover:scale-110", active && "text-brand")} />
                                    <span className="flex-1">{item.label}</span>
                                    {item.badge && (
                                        <span className="rounded-full bg-brand px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white">{item.badge}</span>
                                    )}
                                </Link>
                            )
                        })}
                    </div>
                ))}
            </nav>

            <div className="flex items-center gap-3 border-t p-4">
                <UserButton afterSignOutUrl="/" />
                <div className="text-sm">
                    <p className="font-medium text-slate-900">Account</p>
                    <p className="text-xs text-slate-500">Manage profile</p>
                </div>
            </div>
        </>
    )

    return (
        <div className="flex min-h-screen bg-slate-50">
            {/* Desktop sidebar */}
            <aside className="fixed inset-y-0 hidden w-64 flex-col border-r bg-white lg:flex">{sidebar}</aside>

            {/* Mobile drawer */}
            {mobileOpen && (
                <div className="fixed inset-0 z-50 lg:hidden">
                    <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setMobileOpen(false)} />
                    <aside className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col bg-white shadow-2xl animate-in slide-in-from-left duration-200">{sidebar}</aside>
                </div>
            )}

            <div className="flex min-w-0 flex-1 flex-col lg:ml-64">
                {/* Mobile top bar */}
                <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b bg-white/90 px-4 backdrop-blur lg:hidden">
                    <button onClick={() => setMobileOpen(true)} className="rounded-md p-1.5 text-slate-600 hover:bg-slate-100" aria-label="Open menu">
                        <LucideMenu className="h-5 w-5" />
                    </button>
                    <span className="flex-1 truncate font-bold text-ink">{currentLabel}</span>
                    <UserButton afterSignOutUrl="/" />
                </header>

                <main className="flex-1 px-4 py-6 sm:px-6 lg:p-8">
                    <div className="mx-auto mb-4 hidden max-w-6xl text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 lg:block">
                        Dashboard / {currentLabel}
                    </div>
                    <div className="mx-auto max-w-6xl">{children}</div>
                </main>
            </div>
        </div>
    )
}
