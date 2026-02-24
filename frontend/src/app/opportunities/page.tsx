"use client";

import Link from "next/link";
import { ArrowLeft, Briefcase, GraduationCap, BookOpen, Trophy, ExternalLink, Loader2, Sparkles } from "lucide-react";
import { BottomNav } from "@/components/ui/BottomNav";
import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";

type OppType = "internship" | "scholarship" | "competition" | "fellowship";

interface Opportunity {
    id: string;
    type: OppType;
    title: string;
    org: string;
    match?: number;
    deadline: string;
    stipend?: string;
    tags: string[];
    apply_url?: string;
}

const typeConfig: Record<OppType, { icon: React.ReactNode; color: string; label: string }> = {
    internship: { icon: <Briefcase className="w-3.5 h-3.5" />, color: "bg-blue-100 text-blue-700", label: "Internship" },
    scholarship: { icon: <GraduationCap className="w-3.5 h-3.5" />, color: "bg-violet-100 text-violet-700", label: "Scholarship" },
    competition: { icon: <Trophy className="w-3.5 h-3.5" />, color: "bg-amber-100 text-amber-700", label: "Competition" },
    fellowship: { icon: <BookOpen className="w-3.5 h-3.5" />, color: "bg-emerald-100 text-emerald-700", label: "Fellowship" },
};

const demoOpportunities: Opportunity[] = [
    { id: "1", type: "internship", title: "Google Summer of Code 2026", org: "Google", match: 84, deadline: "Mar 18, 2026", stipend: "₹1.8L/mo", tags: ["Open Source", "Remote", "Stipend"] },
    { id: "2", type: "scholarship", title: "NASSCOM Foundation Scholarship", org: "NASSCOM", match: 71, deadline: "Apr 2, 2026", tags: ["Merit-based", "₹50,000"] },
    { id: "3", type: "fellowship", title: "Teach For India Fellowship", org: "Teach For India", match: 63, deadline: "May 10, 2026", tags: ["Social Impact", "2-year"] },
    { id: "4", type: "competition", title: "Smart India Hackathon 2026", org: "MoE, GoI", match: 91, deadline: "Mar 5, 2026", tags: ["Team", "National Level", "₹1L Prize"] },
    { id: "5", type: "internship", title: "Microsoft Explore Program", org: "Microsoft", match: 68, deadline: "Apr 15, 2026", stipend: "₹2.1L/mo", tags: ["Software", "Hybrid"] },
];

function MatchRing({ pct }: { pct: number }) {
    const color = pct >= 80 ? "text-emerald-500" : pct >= 60 ? "text-primary" : "text-amber-500";
    return (
        <div className="relative w-12 h-12 flex items-center justify-center flex-shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15" fill="none" stroke="#f1f5f9" strokeWidth="3" />
                <circle cx="18" cy="18" r="15" fill="none" stroke="currentColor" strokeWidth="3"
                    className={color}
                    strokeDasharray="94.2"
                    strokeDashoffset={94.2 - (94.2 * pct) / 100}
                    strokeLinecap="round"
                />
            </svg>
            <span className={`absolute text-[10px] font-extrabold ${color}`}>{pct}%</span>
        </div>
    );
}

const filterTypes = ["All", "Internship", "Scholarship", "Competition", "Fellowship"];

export default function OpportunitiesPage() {
    const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
    const [activeFilter, setActiveFilter] = useState("All");
    const [isLoading, setIsLoading] = useState(true);
    const [isAISearching, setIsAISearching] = useState(false);

    useEffect(() => {
        async function fetchOpportunities() {
            try {
                const data = await apiFetch("/opportunities");
                setOpportunities(data.opportunities?.length > 0 ? data.opportunities : demoOpportunities);
            } catch {
                setOpportunities(demoOpportunities);
            } finally {
                setIsLoading(false);
            }
        }
        fetchOpportunities();
    }, []);

    const handleAISearch = async () => {
        setIsAISearching(true);
        try {
            // Trigger the Opportunity Scout sub-agent via the Mentor chat
            const data = await apiFetch("/mentor/chat", {
                method: "POST",
                body: JSON.stringify({ message: "Find the latest internships and hackathons relevant to my profile." }),
            });
            // We don't replace the list because it's a chat response, but we could in the future.
            // Show result as toast or redirect to mentor.
            console.log("Opportunity Scout result:", data.reply);
        } catch (e) {
            console.error(e);
        } finally {
            setIsAISearching(false);
        }
    };

    const filtered = activeFilter === "All" ? opportunities
        : opportunities.filter((o) => o.type === activeFilter.toLowerCase());

    const sorted = [...filtered].sort((a, b) => (b.match || 0) - (a.match || 0));

    return (
        <main className="min-h-screen bg-surface pb-24">
            <div className="fixed inset-0 bg-hero-gradient pointer-events-none" />

            <div className="max-w-2xl mx-auto px-4 relative z-10">
                {/* Header */}
                <header className="sticky top-0 z-40 glass border-b border-white/40 -mx-4 px-4 py-4 mb-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Link href="/dashboard" className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors text-slate-500">
                                <ArrowLeft className="w-5 h-5" />
                            </Link>
                            <div>
                                <h1 className="font-bold text-slate-800">Opportunity Radar</h1>
                                <p className="text-xs text-slate-400">AI-matched to your profile · {opportunities.length} found</p>
                            </div>
                        </div>
                        <button
                            onClick={handleAISearch}
                            disabled={isAISearching}
                            className="flex items-center gap-1.5 bg-primary/10 text-primary text-xs font-semibold px-3 py-2 rounded-xl hover:bg-primary/20 transition-colors disabled:opacity-50"
                        >
                            {isAISearching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                            AI Scout
                        </button>
                    </div>
                </header>

                {/* Filter chips */}
                <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
                    {filterTypes.map((f) => (
                        <button
                            key={f}
                            onClick={() => setActiveFilter(f)}
                            className={`flex-shrink-0 text-xs font-semibold px-4 py-2 rounded-full border transition-all ${activeFilter === f
                                ? "bg-primary text-white border-primary shadow-sm"
                                : "bg-white/60 text-slate-500 border-slate-200 hover:border-primary/50 hover:text-primary"
                                }`}
                        >
                            {f}
                        </button>
                    ))}
                </div>

                {/* Opportunity Cards */}
                {isLoading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="w-8 h-8 text-primary animate-spin" />
                    </div>
                ) : (
                    <div className="space-y-3">
                        {sorted.map((opp) => {
                            const config = typeConfig[opp.type] || typeConfig.internship;
                            return (
                                <div key={opp.id} className="glass p-4 rounded-2xl hover:shadow-md transition-shadow">
                                    <div className="flex items-start gap-4">
                                        {opp.match !== undefined ? (
                                            <MatchRing pct={opp.match} />
                                        ) : (
                                            <div className="w-12 h-12 flex-shrink-0" />
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <div>
                                                    <p className="text-sm font-bold text-slate-800 leading-tight">{opp.title}</p>
                                                    <p className="text-xs text-slate-400 mt-0.5">{opp.org}</p>
                                                </div>
                                                {opp.apply_url && (
                                                    <a href={opp.apply_url} target="_blank" rel="noopener noreferrer"
                                                        className="text-slate-400 hover:text-primary transition-colors flex-shrink-0 mt-0.5"
                                                    >
                                                        <ExternalLink className="w-4 h-4" />
                                                    </a>
                                                )}
                                            </div>

                                            <div className="flex flex-wrap gap-1.5 mt-2">
                                                <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${config.color}`}>
                                                    {config.icon}
                                                    {config.label}
                                                </span>
                                                {opp.stipend && (
                                                    <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">
                                                        {opp.stipend}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="flex flex-wrap gap-1.5 mt-1.5">
                                                {(opp.tags || []).map((t) => (
                                                    <span key={t} className="text-[10px] text-slate-500 bg-slate-100/80 px-2 py-0.5 rounded-full">
                                                        {t}
                                                    </span>
                                                ))}
                                            </div>

                                            <p className="text-[10px] text-slate-400 mt-2">
                                                Deadline: <span className="font-semibold text-coral">{opp.deadline}</span>
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        {sorted.length === 0 && (
                            <p className="text-center py-12 text-slate-400 text-sm">No opportunities found for this filter.</p>
                        )}
                    </div>
                )}
            </div>

            <BottomNav />
        </main>
    );
}
