import Link from "next/link"
import { Button } from "@/components/ui/button"
import CtrGrader from "@/components/marketing/CtrGrader"
import {
  LucideArrowRight, LucideCheckCircle2, LucideImage, LucideLayers, LucideRefreshCcw, LucideGauge,
  LucideRadar, LucideSearch, LucideSparkles, LucideZap,
} from "lucide-react"

const PILLARS = [
  {
    icon: LucideImage,
    eyebrow: "Packaging Studio",
    title: "Know if it'll get clicked before you publish",
    desc: "GPT-4o Vision grades your thumbnail and title together on contrast, focal point, mobile readability, curiosity and synergy, then rewrites the title to fit the image.",
    points: ["Live mobile feed preview, light and dark", "5 sub-scores plus a calibrated packaging score", "3 alternative titles and 2 thumbnail concepts per grade"],
  },
  {
    icon: LucideLayers,
    eyebrow: "Repurposing Studio",
    title: "One upload becomes a week of content",
    desc: "Paste a transcript and get a Shorts script with a 3-second hook, TikTok openers, a Community poll and an X thread, all pointing back to the long-form video.",
    points: ["Shorts script with hook, body and CTA", "3 scroll-stopping opener variations", "Copy-ready community post and thread"],
  },
  {
    icon: LucideRefreshCcw,
    eyebrow: "Video Revival",
    title: "Find the old videos that are quietly losing views",
    desc: "We model how views normally grow on your channel and flag uploads that are decaying or underperforming for their age, then draft a repackage to restart traffic.",
    points: ["Age-adjusted performance, not raw views", "Decay detection from your stats history", "New titles, thumbnail brief and pinned comment"],
  },
  {
    icon: LucideGauge,
    eyebrow: "Channel Velocity Audit",
    title: "See whether your momentum is up or down",
    desc: "A 10-point health check covering cadence, momentum, packaging consistency and metadata, plus a chart of every recent upload against your own baseline.",
    points: ["Momentum: latest 5 uploads vs the 10 before", "Upload cadence and consistency checks", "Breakout outliers to copy"],
  },
]

const PLANS = [
  {
    name: "Starter",
    price: "$0",
    blurb: "For creators testing their packaging.",
    features: ["5 CTR grades per day", "Channel Velocity Audit", "Video Revival detection", "Repurposing Studio (15 runs/hour)"],
    cta: "Start free",
  },
  {
    name: "Pro",
    price: "$29",
    blurb: "For creators publishing every week.",
    features: ["100 CTR grades per day", "120 AI runs per hour", "Revival packages for every candidate", "Competitor topic-gap scans", "Keyword research"],
    popular: true,
    cta: "Go Pro",
  },
  {
    name: "Agency",
    price: "$79",
    blurb: "For teams managing several channels.",
    features: ["400 CTR grades per day", "Highest AI limits (400 runs/hour)", "Multi-channel workflows", "Priority support"],
    cta: "Start with Agency",
  },
]

const FAQ = [
  {
    q: "Is the score my actual click-through rate?",
    a: "No, and any tool that claims to know your CTR before you publish is guessing. The packaging score rates your thumbnail and title against what typically performs in your niche. Use it to compare options and catch problems; your real CTR still lives in YouTube Studio.",
  },
  {
    q: "Do I need to connect my channel to use the grader?",
    a: "No. The grader on this page works with an upload or any public YouTube link. Connecting a channel unlocks the audit, revival and repurposing workflows.",
  },
  {
    q: "What happens to the thumbnails I upload?",
    a: "Images are compressed and sent to the vision model for grading. We keep the score and feedback so repeat grades are instant, but we don't store your original image file.",
  },
]

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-white text-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand shadow-lg shadow-brand/30">
              <LucideZap className="h-4 w-4 fill-white text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight text-white">TubeMagic <span className="text-brand">Velocity</span></span>
          </Link>
          <nav className="hidden items-center gap-8 text-sm font-medium text-slate-300 md:flex">
            <Link href="#grader" className="transition-colors hover:text-white">Free Grader</Link>
            <Link href="#features" className="transition-colors hover:text-white">Features</Link>
            <Link href="#pricing" className="transition-colors hover:text-white">Pricing</Link>
            <Link href="#faq" className="transition-colors hover:text-white">FAQ</Link>
          </nav>
          <div className="flex items-center gap-2">
            <Button variant="ghost" asChild className="hidden text-slate-200 hover:bg-white/10 hover:text-white sm:inline-flex">
              <Link href="/sign-in">Log in</Link>
            </Button>
            <Button asChild className="rounded-full bg-brand px-5 font-bold hover:bg-brand-hover">
              <Link href="/sign-up">Get started</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero + grader */}
        <section id="grader" className="relative isolate scroll-mt-16 overflow-hidden bg-slate-950 px-4 pb-20 pt-16 text-white sm:px-6 lg:px-8 lg:pb-28 lg:pt-24">
          <div className="absolute left-1/2 top-0 -z-10 h-[600px] w-[1100px] -translate-x-1/2 rounded-full bg-brand/20 blur-[120px]" />
          <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_at_top,black_30%,transparent_70%)]" />

          <div className="mx-auto max-w-7xl">
            <div className="mx-auto max-w-3xl space-y-6 text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand/10 px-4 py-1.5 text-[11px] font-bold uppercase tracking-widest text-brand">
                <LucideSparkles className="h-3.5 w-3.5" />
                High-CTR Creator Copilot &amp; Packaging Suite
              </div>
              <h1 className="text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
                Win the click <span className="bg-gradient-to-r from-brand to-amber-300 bg-clip-text text-transparent">before</span> you hit publish.
              </h1>
              <p className="mx-auto max-w-2xl text-lg leading-relaxed text-slate-300">
                Grade your thumbnail and title the way viewers actually see them, turn every video into Shorts, and revive the old uploads that are quietly losing views.
              </p>
              <ul className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-slate-400">
                {["Free, no signup", "Upload or paste any YouTube link", "Results in about 10 seconds"].map((item) => (
                  <li key={item} className="flex items-center gap-1.5">
                    <LucideCheckCircle2 className="h-4 w-4 text-emerald-400" /> {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-12">
              <CtrGrader />
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="border-b px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-3">
            {[
              { n: "01", title: "Grade", desc: "Score every thumbnail and title combo before it goes live. Pick the winner, not the one you like most." },
              { n: "02", title: "Repurpose", desc: "Turn the finished video into Shorts, hooks, a poll and a thread so one upload feeds every channel." },
              { n: "03", title: "Revive", desc: "Each week, see which older videos are slipping and repackage them to restart suggested traffic." },
            ].map((step) => (
              <div key={step.n} className="space-y-2">
                <span className="font-mono text-sm font-bold text-brand">{step.n}</span>
                <h3 className="text-xl font-bold">{step.title}</h3>
                <p className="text-sm leading-relaxed text-slate-500">{step.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Pillars */}
        <section id="features" className="scroll-mt-16 bg-slate-50 px-4 py-24 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="mx-auto mb-16 max-w-2xl space-y-4 text-center">
              <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Packaging is the multiplier on every video you make</h2>
              <p className="text-slate-500">The same video with better packaging reaches more people. TubeMagic Velocity is built around that one lever.</p>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              {PILLARS.map((pillar) => (
                <div key={pillar.eyebrow} className="group rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200/70 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
                  <div className="mb-6 flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-soft text-brand transition-colors group-hover:bg-brand group-hover:text-white">
                      <pillar.icon className="h-5 w-5" />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-widest text-slate-400">{pillar.eyebrow}</span>
                  </div>
                  <h3 className="mb-3 text-2xl font-bold leading-tight">{pillar.title}</h3>
                  <p className="mb-6 text-sm leading-relaxed text-slate-500">{pillar.desc}</p>
                  <ul className="space-y-2">
                    {pillar.points.map((point) => (
                      <li key={point} className="flex items-start gap-2 text-sm text-slate-700">
                        <LucideCheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" /> {point}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="mt-6 grid gap-6 sm:grid-cols-2">
              {[
                { icon: LucideRadar, title: "Competitor topic gaps", desc: "See which topics are working for channels in your niche that you haven't covered yet." },
                { icon: LucideSearch, title: "Keyword research", desc: "Gauge competition for a search term and get related angles before you script." },
              ].map((item) => (
                <div key={item.title} className="flex items-start gap-4 rounded-2xl bg-white p-6 ring-1 ring-slate-200/70">
                  <item.icon className="mt-0.5 h-5 w-5 shrink-0 text-slate-400" />
                  <div>
                    <h3 className="font-bold">{item.title}</h3>
                    <p className="text-sm text-slate-500">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="scroll-mt-16 px-4 py-24 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-5xl">
            <div className="mb-16 space-y-4 text-center">
              <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Simple pricing that scales with your uploads</h2>
              <p className="text-slate-500">Start free. Upgrade when grading becomes part of every upload.</p>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {PLANS.map((plan) => (
                <div
                  key={plan.name}
                  className={`relative flex flex-col justify-between rounded-3xl p-8 ${plan.popular ? "bg-slate-950 text-white shadow-2xl shadow-brand/20 ring-2 ring-brand" : "bg-white ring-1 ring-slate-200"}`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white">
                      Most popular
                    </div>
                  )}
                  <div>
                    <h3 className={`mb-1 text-sm font-bold uppercase tracking-widest ${plan.popular ? "text-brand" : "text-slate-400"}`}>{plan.name}</h3>
                    <p className={`mb-6 text-sm ${plan.popular ? "text-slate-400" : "text-slate-500"}`}>{plan.blurb}</p>
                    <div className="mb-8 flex items-baseline">
                      <span className="text-5xl font-extrabold tracking-tight">{plan.price}</span>
                      <span className={`ml-1 ${plan.popular ? "text-slate-400" : "text-slate-500"}`}>/mo</span>
                    </div>
                    <ul className="mb-8 space-y-3">
                      {plan.features.map((f) => (
                        <li key={f} className={`flex items-start gap-3 text-sm ${plan.popular ? "text-slate-200" : "text-slate-600"}`}>
                          <LucideCheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <Button asChild className={`h-12 w-full rounded-full font-bold ${plan.popular ? "bg-brand hover:bg-brand-hover" : "bg-slate-900 hover:bg-slate-800"}`}>
                    <Link href="/sign-up">{plan.cta}</Link>
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="scroll-mt-16 bg-slate-50 px-4 py-24 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <h2 className="mb-10 text-center text-3xl font-extrabold tracking-tight">Straight answers</h2>
            <div className="space-y-3">
              {FAQ.map((item) => (
                <details key={item.q} className="group rounded-2xl bg-white p-6 ring-1 ring-slate-200/70 [&_summary::-webkit-details-marker]:hidden">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-bold">
                    {item.q}
                    <span className="text-xl text-slate-400 transition-transform group-open:rotate-45">+</span>
                  </summary>
                  <p className="mt-4 text-sm leading-relaxed text-slate-600">{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="bg-slate-950 px-4 py-20 text-center text-white sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl space-y-6">
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Your next video deserves better packaging.</h2>
            <p className="text-slate-400">Connect your channel in 30 seconds and get your Velocity Audit, revival candidates and 5 free CTR grades every day.</p>
            <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button asChild size="lg" className="h-12 rounded-full bg-brand px-8 font-bold hover:bg-brand-hover">
                <Link href="/sign-up">Start free <LucideArrowRight className="h-4 w-4" /></Link>
              </Button>
              <Button asChild size="lg" variant="ghost" className="h-12 rounded-full px-8 font-bold text-slate-200 hover:bg-white/10 hover:text-white">
                <Link href="#grader">Try the free grader</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t bg-white px-4 py-10 text-sm text-slate-500 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 md:flex-row">
          <div className="flex items-center gap-2">
            <LucideZap className="h-4 w-4 text-brand" />
            <span className="font-bold text-slate-900">TubeMagic Velocity</span>
            <span>© {new Date().getFullYear()}</span>
          </div>
          <div className="flex gap-8">
            <Link href="/grader" className="hover:text-brand">Free CTR Grader</Link>
            <Link href="#" className="hover:text-brand">Terms</Link>
            <Link href="#" className="hover:text-brand">Privacy</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
