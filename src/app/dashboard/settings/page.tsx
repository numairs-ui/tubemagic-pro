"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LucideCreditCard, LucideShield, LucideBell, LucideLoader2, LucideCheckCircle2, LucideInfo } from "lucide-react"
import { useState, useEffect, Suspense } from "react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { useSearchParams } from "next/navigation"

export default function SettingsPage() {
    return (
        <div className="space-y-8 max-w-4xl">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                <p className="text-slate-500 text-lg">Manage your account, subscription, and notifications.</p>
            </div>
            <Suspense fallback={<div className="flex items-center justify-center min-h-[400px]"><LucideLoader2 className="w-8 h-8 animate-spin text-slate-300" /></div>}>
                <SettingsContent />
            </Suspense>
        </div>
    )
}

function SettingsContent() {
    const searchParams = useSearchParams()
    const [isLoading, setIsLoading] = useState(true)
    const [isUpgrading, setIsUpgrading] = useState(false)
    const [isSavingNotifications, setIsSavingNotifications] = useState(false)
    const [plan, setPlan] = useState("Free")
    const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(null)
    const [periodEnd, setPeriodEnd] = useState<string | null>(null)
    const [isOpeningPortal, setIsOpeningPortal] = useState(false)
    const [emailNotifications, setEmailNotifications] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [successMessage, setSuccessMessage] = useState<string | null>(null)

    useEffect(() => {
        fetchSettings()

        if (searchParams.get("success")) {
            setSuccessMessage("Successfully upgraded to Pro! Welcome aboard.")
        }
        if (searchParams.get("canceled")) {
            setError("Upgrade process was cancelled.")
        }
    }, [searchParams])

    const fetchSettings = async () => {
        try {
            const res = await fetch("/api/settings/summary")
            const data = await res.json()
            if (data.plan) setPlan(data.plan.charAt(0).toUpperCase() + data.plan.slice(1))
            if (data.email_notifications !== undefined) setEmailNotifications(data.email_notifications)
            setSubscriptionStatus(data.subscription_status ?? null)
            setPeriodEnd(data.current_period_end ?? null)
        } catch (err) {
            console.error("Failed to fetch settings:", err)
        } finally {
            setIsLoading(false)
        }
    }

    const handleManageBilling = async () => {
        setIsOpeningPortal(true)
        setError(null)
        try {
            const res = await fetch("/api/billing/portal", { method: "POST" })
            const data = await res.json()
            if (data.url) window.location.href = data.url
            else setError(data.error || "Could not open the billing portal.")
        } catch {
            setError("Could not open the billing portal.")
        } finally {
            setIsOpeningPortal(false)
        }
    }

    const handleUpgrade = async () => {
        setIsUpgrading(true)
        setError(null)
        try {
            const res = await fetch("/api/billing/checkout", { method: "POST" })
            const data = await res.json()

            if (data.url) {
                window.location.href = data.url
            } else {
                setError(data.error || "Failed to initiate checkout.")
            }
        } catch {
            setError("An unexpected error occurred.")
        } finally {
            setIsUpgrading(false)
        }
    }

    const toggleNotifications = async (checked: boolean) => {
        setIsSavingNotifications(true)
        setEmailNotifications(checked)
        try {
            const res = await fetch("/api/settings/notifications", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ emailNotifications: checked })
            })
            const data = await res.json()
            if (!data.success) {
                setEmailNotifications(!checked) // Revert on failure
                setError(data.error || "Failed to update notification settings.")
            }
        } catch {
            setEmailNotifications(!checked) // Revert on failure
            setError("Failed to update notification settings.")
        } finally {
            setIsSavingNotifications(false)
        }
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <LucideLoader2 className="w-8 h-8 animate-spin text-slate-300" />
            </div>
        )
    }

    return (
        <>
            {successMessage && (
                <div className="p-4 bg-green-50 border border-green-100 rounded-xl flex items-center gap-3 text-green-700 animate-in fade-in slide-in-from-top-2 duration-500">
                    <LucideCheckCircle2 className="w-5 h-5" />
                    <p className="font-medium">{successMessage}</p>
                </div>
            )}

            {error && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-700">
                    <LucideInfo className="w-5 h-5" />
                    <p className="font-medium text-sm">{error}</p>
                </div>
            )}

            <div className="grid gap-6">
                <Card className="overflow-hidden border-slate-200">
                    <CardHeader className="bg-slate-50/50">
                        <div className="flex items-center space-x-2">
                            <LucideCreditCard className="w-5 h-5 text-slate-500" />
                            <CardTitle>Subscription Plan</CardTitle>
                        </div>
                        <CardDescription>You are currently on the <span className="font-bold text-slate-900">{plan}</span> plan.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between pt-6 space-y-4 sm:space-y-0">
                        <div className="text-sm">
                            <p className="font-bold text-slate-900 text-lg">TubeMagic Velocity Pro</p>
                            <p className="text-slate-500">100 CTR grades a day, higher AI limits, revival packages and competitor topic-gap scans.</p>
                            {subscriptionStatus === "past_due" && (
                                <p className="mt-2 text-amber-700 font-medium">Your last payment failed. Update your card to keep Pro.</p>
                            )}
                            {periodEnd && plan !== "Free" && (
                                <p className="mt-1 text-xs text-slate-400">Current period ends {new Date(periodEnd).toLocaleDateString()}</p>
                            )}
                        </div>
                        {plan === "Free" ? (
                            <Button
                                onClick={handleUpgrade}
                                disabled={isUpgrading}
                                className="bg-brand hover:bg-brand-hover shadow-lg shadow-brand/20 px-8 h-11 font-bold"
                            >
                                {isUpgrading ? <LucideLoader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                Upgrade Now
                            </Button>
                        ) : (
                            <div className="flex flex-wrap items-center gap-3">
                                <div className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-full text-sm font-bold border border-green-100">
                                    <LucideCheckCircle2 className="w-4 h-4" />
                                    {subscriptionStatus === "trialing" ? "Trial" : "Active"}
                                </div>
                                <Button variant="outline" onClick={handleManageBilling} disabled={isOpeningPortal} className="h-10 font-bold">
                                    {isOpeningPortal && <LucideLoader2 className="w-4 h-4 animate-spin" />}
                                    Manage billing
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <div className="flex items-center space-x-2">
                            <LucideBell className="w-5 h-5 text-slate-500" />
                            <CardTitle>Notifications</CardTitle>
                        </div>
                        <CardDescription>Stay updated on competitor trends and viral topics in your niche.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                            <div className="space-y-0.5">
                                <Label htmlFor="email-alerts" className="text-base font-semibold">Email Alerts</Label>
                                <p className="text-sm text-slate-500">Receive weekly reports on niche trends and competitor movement.</p>
                            </div>
                            <div className="flex items-center gap-3">
                                {isSavingNotifications && <LucideLoader2 className="w-4 h-4 animate-spin text-slate-400" />}
                                <Switch
                                    id="email-alerts"
                                    checked={emailNotifications}
                                    onCheckedChange={toggleNotifications}
                                    disabled={isSavingNotifications}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <div className="flex items-center space-x-2">
                            <LucideShield className="w-5 h-5 text-slate-500" />
                            <CardTitle>API Configuration</CardTitle>
                        </div>
                        <CardDescription>Manage your personal API keys for custom integrations.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between text-sm p-3 border rounded-lg">
                            <span className="font-medium text-slate-700">YouTube Data API V3</span>
                            <div className="flex items-center gap-2 text-green-600 bg-green-50 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border border-green-100">
                                <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                                Connected
                            </div>
                        </div>
                        <div className="flex items-center justify-between text-sm p-3 border rounded-lg">
                            <span className="font-medium text-slate-700">OpenAI GPT-4o Vision + GPT-4o-mini</span>
                            <div className="flex items-center gap-2 text-green-600 bg-green-50 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border border-green-100">
                                <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                                Connected
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    )
}
