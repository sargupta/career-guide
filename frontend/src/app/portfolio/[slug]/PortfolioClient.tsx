"use client";

import { Loader2, Trophy, Briefcase, Star, Github, Linkedin, ExternalLink, Share2, Award, Zap, Anchor } from "lucide-react";

interface PortfolioData {
    portfolio: {
        bio: string;
        theme?: string;
        highlights: { title: string; reason: string }[];
        profiles: {
            full_name: string;
            avatar_url: string | null;
            domains: { name: string };
        };
    };
    achievements: any[];
}

export default function PortfolioClient({ data, slug }: { data: PortfolioData, slug: string }) {
    const { portfolio, achievements } = data;
    const theme = portfolio.theme || "modern";

    const handleShareLinkedIn = () => {
        const url = window.location.href;
        const shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
        window.open(shareUrl, "_blank");
    };

    // Theme-specific styles
    const themes: Record<string, any> = {
        modern: {
            bg: "bg-slate-50",
            heroBg: "bg-white",
            accent: "bg-primary",
            textPrimary: "text-primary",
            textSlate: "text-slate-900",
            card: "bg-white border-slate-100 shadow-sm",
            sidebar: "bg-slate-900 text-white",
            highlightIcon: "text-primary fill-primary",
            buttonPrimary: "bg-slate-900 text-white hover:bg-slate-800",
            buttonSecondary: "bg-white text-slate-700 border-slate-200 hover:bg-slate-50",
        },
        royal: {
            bg: "bg-slate-950",
            heroBg: "bg-slate-900",
            accent: "bg-amber-500",
            textPrimary: "text-amber-500",
            textSlate: "text-white",
            card: "bg-slate-900 border-slate-800 shadow-xl",
            sidebar: "bg-amber-500 text-slate-950",
            highlightIcon: "text-slate-950 fill-slate-950",
            buttonPrimary: "bg-amber-500 text-slate-950 hover:bg-amber-400 font-black",
            buttonSecondary: "bg-transparent text-amber-500 border-amber-500/50 hover:bg-amber-500/10",
        },
        minimal: {
            bg: "bg-white",
            heroBg: "bg-white",
            accent: "bg-black",
            textPrimary: "text-black",
            textSlate: "text-black",
            card: "bg-white border-black/10 shadow-none hover:border-black transition-colors",
            sidebar: "bg-black text-white",
            highlightIcon: "text-white fill-white",
            buttonPrimary: "bg-black text-white hover:bg-zinc-800",
            buttonSecondary: "bg-white text-black border-black hover:bg-zinc-100",
        }
    };

    const s = themes[theme] || themes.modern;

    return (
        <div className={`min-h-screen ${s.bg} selection:bg-primary/20 transition-colors duration-500`}>
            {/* Hero Section */}
            <div className={`relative ${s.heroBg} pt-16 pb-32 overflow-hidden border-b ${theme === 'minimal' ? 'border-black/5' : 'border-transparent'}`}>
                <div className={`absolute top-0 left-0 w-full h-1.5 ${s.accent}`} />
                <div className="max-w-4xl mx-auto px-6 relative z-10">
                    <div className="flex flex-col md:flex-row items-center gap-8 mb-12">
                        <div className={`w-36 h-36 rounded-3xl ${theme === 'minimal' ? 'bg-zinc-100' : 'bg-primary/10'} flex-shrink-0 flex items-center justify-center text-4xl font-bold ${s.textPrimary} shadow-inner border ${theme === 'minimal' ? 'border-black' : 'border-primary/5'} overflow-hidden`}>
                            {portfolio.profiles.avatar_url ? (
                                <img src={portfolio.profiles.avatar_url} alt={portfolio.profiles.full_name} className="w-full h-full object-cover" />
                            ) : (
                                portfolio.profiles.full_name[0]
                            )}
                        </div>
                        <div className="text-center md:text-left">
                            <div className="flex items-center justify-center md:justify-start gap-4 mb-2">
                                <h1 className={`text-5xl font-extrabold ${s.textSlate} tracking-tight`}>
                                    {portfolio.profiles.full_name}
                                </h1>
                                <button
                                    onClick={handleShareLinkedIn}
                                    className={`p-2 hover:bg-slate-100 rounded-full transition-colors ${s.textPrimary}`}
                                    title="Share to LinkedIn"
                                >
                                    <Share2 className="w-6 h-6" />
                                </button>
                            </div>
                            <p className={`text-xl font-medium ${s.textPrimary} mb-6`}>
                                Future {portfolio.profiles.domains?.name || "Professional"}
                            </p>
                            <div className="flex flex-wrap justify-center md:justify-start gap-3">
                                <button
                                    onClick={handleShareLinkedIn}
                                    className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all active:scale-95 ${s.buttonPrimary} shadow-lg shadow-black/5`}
                                >
                                    <Linkedin className="w-4 h-4" />
                                    Share to LinkedIn
                                </button>
                                <button className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all active:scale-95 ${s.buttonSecondary} shadow-sm`}>
                                    <Github className="w-4 h-4" />
                                    GitHub
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className={`${theme === 'minimal' ? 'bg-zinc-50' : 'glass'} p-8 md:p-10 border-t-4 ${theme === 'minimal' ? 'border-black' : 'border-primary'} shadow-xl ${theme === 'modern' ? 'shadow-primary/5' : 'shadow-black/20'}`}>
                        <h2 className={`text-xs font-bold ${s.textPrimary} uppercase tracking-widest mb-4`}>Professional Narrative</h2>
                        <div className={`prose ${theme === 'royal' ? 'prose-invert' : 'prose-slate'} max-w-none`}>
                            <p className={`text-xl ${theme === 'royal' ? 'text-slate-300' : 'text-slate-700'} leading-relaxed font-medium italic opacity-90`}>
                                "{portfolio.bio}"
                            </p>
                        </div>
                    </div>
                </div>

                {theme !== 'minimal' && (
                    <>
                        <div className={`absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 ${theme === 'royal' ? 'bg-amber-500/10' : 'bg-primary/5'} rounded-full blur-3xl`} />
                        <div className={`absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 ${theme === 'royal' ? 'bg-amber-600/10' : 'bg-accent/5'} rounded-full blur-3xl`} />
                    </>
                )}
            </div>

            {/* Content Section */}
            <div className="max-w-4xl mx-auto px-6 -mt-16 pb-24 relative z-20">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <div className="lg:col-span-8 space-y-8">
                        <section>
                            <h3 className={`text-2xl font-bold ${s.textSlate} mb-6 flex items-center gap-3`}>
                                {theme === 'royal' ? <Award className="w-6 h-6 text-amber-500" /> : <Trophy className={`w-6 h-6 ${s.textPrimary}`} />}
                                Portfolio Highlights
                            </h3>
                            <div className="space-y-6">
                                {achievements.map((a: any) => (
                                    <div key={a.id} className={`${s.card} p-8 rounded-3xl transition-all duration-300 group`}>
                                        <div className="flex justify-between items-start mb-4">
                                            <span className={`text-xs font-bold uppercase tracking-[0.2em] ${theme === 'royal' ? 'text-amber-500/60' : 'text-slate-400'}`}>
                                                {a.type}
                                            </span>
                                            <div className="flex items-center gap-3">
                                                <button
                                                    onClick={() => {
                                                        const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.origin + '/portfolio/' + slug)}`;
                                                        window.open(url, "_blank");
                                                    }}
                                                    className={`p-1.5 rounded transition-colors ${theme === 'royal' ? 'text-white/40 hover:text-amber-500 hover:bg-white/5' : 'text-slate-400 hover:text-primary hover:bg-slate-50'}`}
                                                    title="Share achievement"
                                                >
                                                    <Linkedin className="w-4 h-4" />
                                                </button>
                                                <span className={`text-[10px] font-bold ${theme === 'royal' ? 'text-amber-500 bg-amber-500/10 border border-amber-500/20' : 'text-primary bg-primary/5'} px-3 py-1 rounded-full`}>
                                                    {a.academic_year}
                                                </span>
                                            </div>
                                        </div>
                                        <h4 className={`text-xl font-bold ${s.textSlate} mb-3 group-hover:translate-x-1 transition-transform`}>{a.title}</h4>
                                        <p className={`text-base ${theme === 'royal' ? 'text-slate-400' : 'text-slate-600'} leading-relaxed mb-6`}>{a.description}</p>
                                        {a.links_json?.[0] && (
                                            <a href={a.links_json[0]} target="_blank" rel="noopener noreferrer" className={`inline-flex items-center gap-1.5 text-sm font-bold ${s.textPrimary} hover:underline`}>
                                                View Project <ExternalLink className="w-4 h-4" />
                                            </a>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>

                    <aside className="lg:col-span-4 space-y-8">
                        <div className={`${s.sidebar} p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group border ${theme === 'minimal' ? 'border-black' : 'border-transparent'}`}>
                            {theme !== 'minimal' && (
                                <div className={`absolute right-0 top-0 w-32 h-32 ${theme === 'royal' ? 'bg-white/5' : 'bg-primary/20'} blur-2xl rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform`} />
                            )}
                            <h3 className={`text-xs font-black ${theme === 'royal' ? 'text-slate-900 opacity-60' : 'text-primary'} uppercase tracking-[0.3em] mb-8 relative z-10`}>AI IMPACT INSIGHTS</h3>
                            <div className="space-y-8 relative z-10">
                                {portfolio.highlights.map((h, i) => (
                                    <div key={i} className="space-y-3">
                                        <div className="flex items-start gap-3">
                                            {theme === 'royal' ? <Zap className="w-5 h-5 text-slate-900 fill-slate-900 flex-shrink-0 mt-0.5" /> : <Star className={`w-5 h-5 ${s.highlightIcon} flex-shrink-0 mt-0.5`} />}
                                            <p className={`text-base font-bold leading-tight ${theme === 'royal' ? 'text-slate-950' : 'text-white'}`}>{h.title}</p>
                                        </div>
                                        <p className={`text-xs ${theme === 'royal' ? 'text-slate-800' : 'text-slate-400'} leading-relaxed font-medium`}>
                                            {h.reason}
                                        </p>
                                    </div>
                                ))}
                            </div>
                            <div className={`mt-10 pt-6 border-t ${theme === 'royal' ? 'border-slate-900/10' : 'border-white/10'} relative z-10`}>
                                <p className={`text-[10px] ${theme === 'royal' ? 'text-slate-700' : 'text-slate-500'} italic font-medium`}>
                                    Synthesized by SARGVISION AI based on longitudinal student data.
                                </p>
                            </div>
                        </div>

                        <div className={`${theme === 'royal' ? 'bg-slate-900 border-amber-500/20' : theme === 'minimal' ? 'bg-white border-black' : 'bg-emerald-50 border-emerald-100'} border p-8 rounded-[2rem] text-center`}>
                            <div className={`w-14 h-14 ${theme === 'royal' ? 'bg-amber-500 text-slate-900' : theme === 'minimal' ? 'bg-black text-white' : 'bg-emerald-500 text-white'} rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg`}>
                                {theme === 'minimal' ? <Anchor className="w-7 h-7" /> : <Star className="w-7 h-7 fill-current" />}
                            </div>
                            <p className={`text-base font-black ${theme === 'royal' ? 'text-amber-500' : theme === 'minimal' ? 'text-black' : 'text-emerald-900'} mb-1 tracking-widest uppercase`}>SARGVISION VERIFIED</p>
                            <p className={`text-[11px] ${theme === 'royal' ? 'text-slate-500' : theme === 'minimal' ? 'text-slate-400' : 'text-emerald-600'} font-bold`}>Authenticity confirmed via academic logging</p>
                        </div>
                    </aside>
                </div>
            </div>

            {/* Footer */}
            <footer className={`py-16 border-t ${theme === 'minimal' ? 'border-black/10' : 'border-slate-200'} text-center`}>
                <p className={`text-xs ${theme === 'minimal' ? 'text-black' : 'text-slate-400'} font-black uppercase tracking-widest`}>
                    Built with <span className={s.textPrimary}>SARGVISION AI</span> — Empowering the next generation.
                </p>
            </footer>
        </div>
    );
}
