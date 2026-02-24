import Link from "next/link";

export default function LandingPage() {
    return (
        <main className="min-h-screen bg-surface">
            {/* Hero gradient */}
            <div className="fixed inset-0 bg-hero-gradient pointer-events-none" />

            {/* Nav */}
            <nav className="sticky top-0 z-50 glass border-b border-white/40 px-6 py-4">
                <div className="max-w-6xl mx-auto flex items-center justify-between">
                    <span className="text-xl font-extrabold text-primary tracking-tight">
                        SARGVISION<span className="text-accent"> AI</span>
                    </span>
                    <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
                        <a href="#features" className="hover:text-primary transition-colors">Features</a>
                        <a href="#how" className="hover:text-primary transition-colors">How it works</a>
                        <a href="#pricing" className="hover:text-primary transition-colors">Pricing</a>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link href="/login" className="text-sm font-semibold text-slate-600 hover:text-primary transition-colors">
                            Log in
                        </Link>
                        <Link href="/signup" className="btn-primary text-sm py-2 px-5">
                            Get Started
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero */}
            <section className="max-w-6xl mx-auto px-6 pt-20 pb-24 grid md:grid-cols-2 gap-12 items-center">
                <div className="animate-fade-up">
                    <div className="inline-flex items-center gap-2 glass-sm px-4 py-2 text-xs font-semibold text-primary mb-6">
                        ✦ AI-powered · For every Indian student
                    </div>
                    <h1 className="text-5xl md:text-6xl font-extrabold text-slate-900 leading-tight mb-6">
                        Your AI Career<br />
                        <span className="text-primary">Co-Pilot</span>
                    </h1>
                    <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                        From BTech to MBBS, Arts to Agriculture — SARGVISION tracks your full academic
                        journey and guides you to the right career. Any stream. Any college. Any path.
                    </p>
                    <div className="flex flex-wrap gap-4">
                        <Link href="/signup" className="btn-primary">Start Free →</Link>
                        <a href="#how" className="btn-outline">See how it works</a>
                    </div>
                </div>

                {/* Digital Twin mockup card */}
                <div className="glass-lg p-6 animate-float">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">Digital Twin</p>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">A</div>
                        <div>
                            <p className="font-semibold text-slate-800 text-sm">Arjun Sharma</p>
                            <p className="text-xs text-slate-500">BTech Year 2 · Engineering</p>
                        </div>
                    </div>
                    <div className="space-y-4">
                        {[
                            { label: "Software Engineer", pct: 72, color: "bg-primary" },
                            { label: "Product Manager", pct: 51, color: "bg-amber-400" },
                            { label: "Research Scientist", pct: 38, color: "bg-slate-300" },
                        ].map((p) => (
                            <div key={p.label}>
                                <div className="flex justify-between text-xs font-medium text-slate-600 mb-1">
                                    <span>{p.label}</span>
                                    <span className="text-primary font-bold">{p.pct}%</span>
                                </div>
                                <div className="readiness-bar">
                                    <div className={`readiness-bar-fill ${p.color}`} style={{ width: `${p.pct}%` }} />
                                </div>
                            </div>
                        ))}
                    </div>
                    <p className="text-xs text-slate-400 mt-4">Readiness updated based on your activities + skills</p>
                </div>
            </section>

            {/* Domains trust bar */}
            <section className="border-y border-slate-100 bg-white/50 py-6 px-6">
                <div className="max-w-5xl mx-auto">
                    <p className="text-center text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">
                        For students across all streams
                    </p>
                    <div className="flex flex-wrap justify-center gap-4">
                        {["⚙️ Engineering", "🏥 Medicine", "⚖️ Law", "🎨 Arts", "📊 Commerce", "🏛️ Govt Services", "🌾 Agriculture"].map((d) => (
                            <span key={d} className="glass-sm px-4 py-2 text-sm font-medium text-slate-700">{d}</span>
                        ))}
                    </div>
                </div>
            </section>

            {/* Features */}
            <section id="features" className="max-w-6xl mx-auto px-6 py-24">
                <h2 className="text-3xl font-bold text-slate-900 text-center mb-4">Everything you need to succeed</h2>
                <p className="text-slate-500 text-center mb-12">One platform. Your entire college career.</p>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 stagger-children">
                    {[
                        { icon: "🧠", title: "Digital Twin", desc: "A living model of your skills, aspirations, and career readiness — updated with every activity." },
                        { icon: "🤖", title: "AI Mentor", desc: "Your personal AI companion. Empathic, profile-aware, and expert in your exact career paths." },
                        { icon: "🎯", title: "Opportunity Radar", desc: "Jobs, internships, govt exams, and scholarships — matched to your profile with a score." },
                        { icon: "📅", title: "Activity Timeline", desc: "Log every project, competition, and internship by academic year. Build your longitudinal record." },
                        { icon: "📈", title: "Readiness Score", desc: "Know exactly how prepared you are for each aspirational path. See gaps. Take next best actions." },
                        { icon: "📚", title: "Learning Paths", desc: "Curated NPTEL, SWAYAM, and free resources — filtered by your domain and career goals." },
                    ].map((f) => (
                        <div key={f.title} className="glass p-6 animate-fade-up hover:shadow-glass-lg transition-shadow duration-300">
                            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-2xl mb-4">{f.icon}</div>
                            <h3 className="font-bold text-slate-800 mb-2">{f.title}</h3>
                            <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* How it works */}
            <section id="how" className="bg-white/50 py-20 px-6 border-y border-slate-100">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-3xl font-bold text-slate-900 mb-12">How it works</h2>
                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            { step: "1", title: "Enroll", desc: "Sign up, pick your domain, and share your aspirations. Our AI analyzes your goals." },
                            { step: "2", title: "Build Your Twin", desc: "Log activities, add skills, and track learning. Your Digital Twin grows with you." },
                            { step: "3", title: "Get Guided", desc: "Your AI Mentor gives personalized advice. See your readiness. Act on next best steps." },
                        ].map((s) => (
                            <div key={s.step} className="glass p-6 text-left">
                                <div className="w-10 h-10 rounded-full bg-primary text-white font-bold flex items-center justify-center text-lg mb-4">{s.step}</div>
                                <h3 className="font-bold text-slate-800 mb-2">{s.title}</h3>
                                <p className="text-sm text-slate-500">{s.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Pricing */}
            <section id="pricing" className="max-w-4xl mx-auto px-6 py-24">
                <h2 className="text-3xl font-bold text-slate-900 text-center mb-12">Simple, affordable pricing</h2>
                <div className="grid md:grid-cols-2 gap-8">
                    {/* Free */}
                    <div className="glass p-8">
                        <p className="font-bold text-slate-800 text-lg mb-1">Free</p>
                        <p className="text-4xl font-extrabold text-slate-900 mb-1">₹0</p>
                        <p className="text-slate-400 text-sm mb-6">Forever free</p>
                        <ul className="space-y-3 text-sm text-slate-600 mb-8">
                            {["Dashboard & Digital Twin (view)", "5 AI Mentor messages/month", "Readiness score (0–100)", "Activity Timeline (up to 5/year)"].map(f => (
                                <li key={f} className="flex items-center gap-2"><span className="text-primary">✓</span>{f}</li>
                            ))}
                        </ul>
                        <Link href="/signup" className="btn-outline w-full text-center block">Get started free</Link>
                    </div>
                    {/* Pro */}
                    <div className="glass-lg p-8 border-2 border-primary relative">
                        <span className="absolute -top-3 left-6 bg-primary text-white text-xs font-bold px-3 py-1 rounded-full">Most Popular</span>
                        <p className="font-bold text-slate-800 text-lg mb-1">Pro</p>
                        <p className="text-4xl font-extrabold text-slate-900 mb-1">₹299<span className="text-lg font-medium text-slate-400">/mo</span></p>
                        <p className="text-slate-400 text-sm mb-6">or ₹2,499/year</p>
                        <ul className="space-y-3 text-sm text-slate-600 mb-8">
                            {["Unlimited AI Mentor", "Readiness gaps + Next best actions", "Full Opportunity Radar + apply tracking", "Learning Paths + progress tracking", "Achievements Portfolio"].map(f => (
                                <li key={f} className="flex items-center gap-2"><span className="text-primary font-bold">✓</span>{f}</li>
                            ))}
                        </ul>
                        <Link href="/signup" className="btn-primary w-full text-center block">Start Pro →</Link>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-slate-100 bg-white/50 px-6 py-10 text-center">
                <p className="text-xl font-extrabold text-primary mb-1">SARGVISION AI</p>
                <p className="text-sm text-slate-400 mb-4">Your career journey starts in Year 1</p>
                <div className="flex justify-center gap-6 text-sm text-slate-500">
                    <a href="#" className="hover:text-primary">Privacy</a>
                    <a href="#" className="hover:text-primary">Terms</a>
                    <a href="#" className="hover:text-primary">Contact</a>
                </div>
                <p className="text-xs text-slate-300 mt-4">© 2026 SARGVISION AI. All rights reserved.</p>
            </footer>
        </main>
    );
}
