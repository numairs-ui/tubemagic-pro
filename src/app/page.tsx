import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LucideVideo, LucideZap, LucideBarChart3, LucideUsers, LucideArrowRight, LucideCheckCircle2, LucideSparkles } from "lucide-react"

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-white text-slate-900 overflow-hidden">
      {/* Header */}
      <header className="px-6 lg:px-20 h-20 flex items-center justify-between border-b bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <Link href="/" className="flex items-center space-x-2">
          <div className="w-9 h-9 bg-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-600/20">
            <LucideVideo className="text-white w-5 h-5" />
          </div>
          <span className="text-2xl font-bold tracking-tight">TubeMagic <span className="text-red-600">Pro</span></span>
        </Link>
        <nav className="hidden md:flex items-center space-x-8 text-sm font-medium text-slate-600">
          <Link href="#features" className="hover:text-red-600 transition-colors">Features</Link>
          <Link href="#pricing" className="hover:text-red-600 transition-colors">Pricing</Link>
        </nav>
        <div className="flex items-center space-x-4">
          <Button variant="ghost" asChild>
            <Link href="/sign-in">Login</Link>
          </Button>
          <Button className="bg-red-600 hover:bg-red-700 shadow-lg shadow-red-600/20 px-6 rounded-full" asChild>
            <Link href="/sign-up">Get Started</Link>
          </Button>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative px-6 pt-20 pb-24 lg:pt-32 lg:pb-40 text-center overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[1000px] bg-red-50/50 rounded-full blur-3xl -z-10" />
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="inline-flex items-center space-x-2 bg-red-50 border border-red-100 px-4 py-1.5 rounded-full text-red-600 text-xs font-bold uppercase tracking-widest">
              <LucideSparkles className="w-3.5 h-3.5" />
              <span>Professional YouTube SEO & Growth Suite</span>
            </div>
            <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight leading-[1.1]">
              Scale Your YouTube Presence with <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-slate-900 uppercase">AI-Precision</span>
            </h1>
            <p className="text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed">
              Ditch the guesswork. Use GPT-4 to generate high-CTR titles, track competitor trends, and optimize your content for the YouTube algorithm in any niche.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" className="bg-red-600 hover:bg-red-700 text-md px-10 h-14 rounded-full shadow-xl shadow-red-600/20" asChild>
                <Link href="/sign-up">
                  Start Growing for Free
                  <LucideArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="text-md px-10 h-14 rounded-full border-slate-200" asChild>
                <Link href="#features">See How it Works</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section id="features" className="px-6 lg:px-20 py-24 bg-slate-50">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16 space-y-4">
              <h2 className="text-3xl font-bold">Everything you need to dominate your niche</h2>
              <p className="text-slate-500 max-w-xl mx-auto">Data-driven tools designed for creators, educators, and brands looking for a competitive edge.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { icon: <LucideZap />, title: "AI SEO Optimizer", desc: "GPT-4 powered titles, descriptions, and tags tailored to your target audience." },
                { icon: <LucideUsers />, title: "Competitor Tracking", desc: "Monitor top channels in your category and spot emerging trends before they peak." },
                { icon: <LucideBarChart3 />, title: "Analytics Dashboard", desc: "Growth metrics and velocity tracking that the standard Studio hides." }
              ].map((feat, i) => (
                <Card key={i} className="p-8 border-none shadow-sm hover:shadow-md transition-shadow">
                  <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center text-red-600 mb-6 font-bold">
                    {feat.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-3">{feat.title}</h3>
                  <p className="text-slate-500 leading-relaxed text-sm">{feat.desc}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="px-6 lg:px-20 py-24">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16 space-y-4">
              <h2 className="text-3xl font-bold">Professional pricing for serious creators</h2>
              <p className="text-slate-500">Pick a plan that matches your channel&apos;s growth stage.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { name: "Starter", price: "$0", features: ["1 Channel", "5 AI Optimizations / mo", "Basic Analytics"], btn: "Get Started" },
                { name: "Pro", price: "$29", features: ["3 Channels", "Unlimited AI Tools", "Competitor Monitoring", "Priority Support"], popular: true, btn: "Start Pro Trial" },
                { name: "Agency", price: "$79", features: ["Unlimited Channels", "Multi-user Access", "Custom API Access", "Brand Reports"], btn: "Contact Sales" }
              ].map((plan, i) => (
                <Card key={i} className={`p-8 flex flex-col justify-between ${plan.popular ? 'border-red-600 ring-4 ring-red-50 shadow-2xl relative' : 'border-slate-100 shadow-lg'}`}>
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-red-600 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase">
                      Most Popular
                    </div>
                  )}
                  <div>
                    <h4 className="text-lg font-bold mb-2 uppercase tracking-widest text-slate-400">{plan.name}</h4>
                    <div className="flex items-baseline mb-6">
                      <span className="text-4xl font-extrabold">{plan.price}</span>
                      <span className="text-slate-500 ml-1">/mo</span>
                    </div>
                    <ul className="space-y-4 mb-8">
                      {plan.features.map((f, j) => (
                        <li key={j} className="flex items-center gap-3 text-sm text-slate-600">
                          <LucideCheckCircle2 className="w-4 h-4 text-green-500" />
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <Button className={`w-full py-6 rounded-full font-bold ${plan.popular ? 'bg-red-600 hover:bg-red-700' : 'bg-slate-900 hover:bg-slate-800'}`} asChild>
                    <Link href="/sign-up">{plan.btn}</Link>
                  </Button>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="px-6 lg:px-20 py-12 border-t bg-slate-50 text-slate-500 text-sm">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center space-x-2">
            <LucideVideo className="w-4 h-4 text-red-600" />
            <span className="font-bold text-slate-900">TubeMagic Pro</span>
            <span>© 2026</span>
          </div>
          <div className="flex space-x-8">
            <Link href="#" className="hover:text-red-600">Twitter</Link>
            <Link href="#" className="hover:text-red-600">Terms</Link>
            <Link href="#" className="hover:text-red-600">Privacy</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
