import type { Metadata } from "next"
import Link from "next/link"
import { LucideZap } from "lucide-react"
import { Button } from "@/components/ui/button"
import CtrGrader from "@/components/marketing/CtrGrader"

export const metadata: Metadata = {
  title: "Free YouTube Thumbnail & Title CTR Grader | TubeMagic Velocity",
  description: "Upload a thumbnail or paste a YouTube link. GPT-4o Vision grades contrast, focal point, mobile readability, curiosity and title synergy in seconds.",
}

/** Standalone, shareable home for the lead-magnet grader. */
export default function GraderPage() {
  return (
    <div className="min-h-screen bg-slate-950 px-4 pb-20 text-white sm:px-6 lg:px-8">
      <header className="mx-auto flex h-16 max-w-7xl items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand">
            <LucideZap className="h-4 w-4 fill-white text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight">TubeMagic <span className="text-brand">Velocity</span></span>
        </Link>
        <Button asChild className="rounded-full bg-brand font-bold hover:bg-brand-hover">
          <Link href="/sign-up">Get started</Link>
        </Button>
      </header>
      <main className="mx-auto max-w-7xl space-y-10 pt-10">
        <div className="mx-auto max-w-2xl space-y-3 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">Thumbnail &amp; Title CTR Grader</h1>
          <p className="text-slate-300">See your packaging the way viewers do, and fix it before you publish.</p>
        </div>
        <CtrGrader />
      </main>
    </div>
  )
}
