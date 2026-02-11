"use client"

import { Button } from "@/components/ui/button"
import { LucideZap, LucideLoader2 } from "lucide-react"
import { useState } from "react"
import { useRouter } from "next/navigation"

interface QuickOptimizeButtonProps {
    latestVideoId?: string
}

export default function QuickOptimizeButton({ latestVideoId }: QuickOptimizeButtonProps) {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)

    const handleQuickOptimize = () => {
        if (!latestVideoId) return

        setIsLoading(true)
        // Redirect to the video details page which has the optimization panel
        router.push(`/dashboard/videos/${latestVideoId}`)
    }

    return (
        <Button
            onClick={handleQuickOptimize}
            disabled={isLoading || !latestVideoId}
            className="bg-red-600 hover:bg-red-700 shadow-lg shadow-red-600/20 px-6 rounded-full font-bold h-11"
        >
            {isLoading ? (
                <LucideLoader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
                <LucideZap className="w-4 h-4 mr-2" />
            )}
            Quick Optimize Latest Video
        </Button>
    )
}
