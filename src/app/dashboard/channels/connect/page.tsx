"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { LucideSearch, LucideLink, LucideLoader2 } from "lucide-react"

export default function ConnectChannelPage() {
    const router = useRouter()
    const [searchQuery, setSearchQuery] = useState("")
    const [searchResults, setSearchResults] = useState<{ id: string; name: string; description: string; thumbnailUrl: string }[]>([])
    const [isSearching, setIsSearching] = useState(false)
    const [isConnecting, setIsConnecting] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!searchQuery.trim()) return

        setIsSearching(true)
        setError(null)
        setSearchResults([])

        try {
            const res = await fetch(`/api/channels/search?q=${encodeURIComponent(searchQuery)}`)
            const data = await res.json()
            if (data.error) throw new Error(data.error)
            setSearchResults(data.channels || [])
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "An unknown error occurred")
        } finally {
            setIsSearching(false)
        }
    }

    const handleConnect = async (channelId: string) => {
        setIsConnecting(channelId)
        setError(null)

        try {
            const res = await fetch("/api/channels/connect", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ channelId }),
            })
            const data = await res.json()

            if (data.error) throw new Error(data.error)

            // Successfully connected
            router.push("/dashboard")
            router.refresh()
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "An unknown error occurred")
            setIsConnecting(null)
        }
    }

    return (
        <div className="max-w-2xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Connect Your Channel</h1>
                <p className="text-slate-500 text-lg">Find your YouTube channel to start using CodeTube Pro.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Search via Channel Name</CardTitle>
                    <CardDescription>Enter the name of your YouTube channel below.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSearch} className="flex gap-2">
                        <div className="relative flex-1">
                            <LucideSearch className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="e.g. Traversy Media"
                                className="pl-9"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <Button type="submit" disabled={isSearching} className="bg-red-600 hover:bg-red-700">
                            {isSearching ? <LucideLoader2 className="h-4 w-4 animate-spin" /> : "Search"}
                        </Button>
                    </form>

                    {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

                    <div className="mt-6 space-y-4">
                        {searchResults.map((channel) => (
                            <div
                                key={channel.id}
                                className="flex items-center justify-between p-4 border rounded-xl hover:bg-slate-50 transition-colors"
                            >
                                <div className="flex items-center space-x-4">
                                    <img src={channel.thumbnailUrl} alt="" className="h-12 w-12 rounded-full border" />
                                    <div>
                                        <h3 className="font-semibold">{channel.name}</h3>
                                        <p className="text-xs text-slate-500 line-clamp-1">{channel.description}</p>
                                    </div>
                                </div>
                                <Button
                                    onClick={() => handleConnect(channel.id)}
                                    disabled={!!isConnecting}
                                    variant={isConnecting === channel.id ? "ghost" : "outline"}
                                >
                                    {isConnecting === channel.id ? (
                                        <LucideLoader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        "Connect"
                                    )}
                                </Button>
                            </div>
                        ))}

                        {searchResults.length === 0 && !isSearching && searchQuery && !error && (
                            <p className="text-center py-4 text-slate-500 text-sm">No channels found for &quot;{searchQuery}&quot;</p>
                        )}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Direct Connect</CardTitle>
                    <CardDescription>Paste your YouTube Channel URL, @handle, or Channel ID directly.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            const formData = new FormData(e.currentTarget);
                            handleConnect(formData.get("channelId") as string);
                        }}
                        className="flex gap-2"
                    >
                        <div className="relative flex-1">
                            <LucideLink className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                            <Input
                                name="channelId"
                                placeholder="https://youtube.com/@NumairShahzada"
                                className="pl-9"
                                required
                            />
                        </div>
                        <Button type="submit" variant="secondary" disabled={!!isConnecting}>
                            {isConnecting && !searchResults.find(c => c.id === isConnecting) ? (
                                <LucideLoader2 className="h-4 w-4 animate-spin" />
                            ) : "Connect Channel"}
                        </Button>
                    </form>
                    <p className="mt-2 text-[10px] text-slate-400">
                        Supports: Full URLs, @handles, and UC... IDs
                    </p>
                </CardContent>
            </Card>

            <div className="flex justify-center">
                <Button variant="ghost" onClick={() => router.back()}>Cancel and go back</Button>
            </div>
        </div>
    )
}
