"use client";

import Link from "next/link";
import { ArrowLeft, RefreshCw, TrendingUp, AlertTriangle, CheckCircle, Loader2, ChevronRight } from "lucide-react";
import { BottomNav } from "@/components/ui/BottomNav";
import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";

interface ReadinessResult {
    career_path_id: string;
    career_path_name: string;
    rank: number;
    score: number;
    skills_score: number;
    activity_score: number;
    learning_score: number;
    recency_bonus: number;
    gaps: string[];
    next_actions: string[];
}

// Demo data when user is not logged in / backend unavailable
const demoReadiness: ReadinessResult[] = [
    {
        career_path_id: "p1",
        career_path_name: "Software Engineering",
        rank: 1,
        score: 72,
        skills_score: 80,
        activity_score: 65,
        learning_score: 70,
        recency_bonus: 60,
        gaps: ["Log more internship activities relevant to this path", "Complete 2 more recommended courses"],
        next_actions: ["Apply for a backend internship", "Enroll in System Design course", "Log your current project this semester"],
    },
    {
        career_path_id: "p2",
        career_path_name: "Product Management",
        rank: 2,
        score: 48,
        skills_score: 45,
        activity_score: 50,
        learning_score: 40,
        recency_bonus: 50,
        gaps: ["Add 3 missing required skills (Product Strategy, SQL, Figma)", "Log a case study or PM competition", "No recent activity this academic year"],
        next_actions: ["Add skill: Product Strategy", "Join a Product case competition", "Log your product brief project"],
    },
];

function ScoreGauge({ score, label }: { score: number; label: string }) {
    const color = score >= 75 ? "#10b981" : score >= 50 ? "#0d9488" : "#f59e0b";
    const r = 52;
    const circ = 2 * Math.PI * r;
    const dash = (score / 100) * circ;

    return (
        <div className="flex flex-col items-center gap-1">
            <div className="relative w-28 h-28">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r={r} fill="none" stroke="#f1f5f9" strokeWidth="10" />
                    <circle
                        cx="60" cy="60" r={r} fill="none"
                        stroke={color} strokeWidth="10"
                        strokeDasharray={circ}
                        strokeDashoffset={circ - dash}
                        strokeLinecap="round"
                        style={{ transition: "stroke-dashoffset 0.8s ease" }}
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-extrabold text-slate-800">{score}</span>
                    <span className="text-[9px] text-slate-400 font-semibold">/ 100</span>
                </div>
            </div>
            <p className="text-xs font-bold text-slate-600 text-center">{label}</p>
        </div>
    );
}

function ComponentBar({ label, value, color }: { label: string; value: number; color: string }) {
    return (
        <div>
            <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs text-slate-500">{label}</span>
                <span className="text-xs font-bold text-slate-700">{value}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2">
                <div
                    className={`h-2 rounded-full ${color} transition-all duration-700`}
                    style={{ width: `${value}%` }}
                />
            </div>
        </div>
    );
}

export default function ReadinessPage() {
    const [data, setData] = useState<ReadinessResult[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [expanded, setExpanded] = useState<string | null>(null);

    const fetchReadiness = async () => {
        try {
            const res = await apiFetch("/readiness");
            if (res.readiness && res.readiness.length > 0) {
                setData(res.readiness);
                setExpanded(res.readiness[0]?.career_path_id ?? null);
            } else {
                setData(demoReadiness);
                setExpanded(demoReadiness[0]?.career_path_id ?? null);
            }
        } catch {
            setData(demoReadiness);
            setExpanded(demoReadiness[0]?.career_path_id ?? null);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchReadiness(); }, []);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        try {
            await apiFetch("/readiness/refresh", { method: "POST" });
            await fetchReadiness();
        } catch {
            await fetchReadiness();
        } finally {
            setIsRefreshing(false);
        }
    };

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
                                <h1 className="font-bold text-slate-800">Readiness Dashboard</h1>
                                <p className="text-xs text-slate-400">Preparation score per career path</p>
                            </div>
                        </div>
                        <button
                            onClick={handleRefresh}
                            disabled={isRefreshing}
                            className="flex items-center gap-1.5 bg-primary/10 text-primary text-xs font-semibold px-3 py-2 rounded-xl hover:bg-primary/20 transition-colors disabled:opacity-50"
                        >
                            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
                            Refresh
                        </button>
                    </div>
                </header>

                {isLoading ? (
                    <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>
                ) : (
                    <div className="space-y-4">
                        {data.map((path) => {
                            const isOpen = expanded === path.career_path_id;
                            const scoreColor = path.score >= 75 ? "text-emerald-500" : path.score >= 50 ? "text-primary" : "text-amber-500";
                            return (
                                <div key={path.career_path_id} className="glass rounded-2xl overflow-hidden">
                                    {/* Card Header — always visible */}
                                    <button
                                        className="w-full p-5 flex items-center justify-between gap-4 text-left"
                                        onClick={() => setExpanded(isOpen ? null : path.career_path_id)}
                                    >
                                        <div className="flex items-center gap-4">
                                            <ScoreGauge score={path.score} label={path.career_path_name} />
                                            <div>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                                                    Path {path.rank}
                                                </p>
                                                <p className="text-base font-bold text-slate-800 leading-tight">{path.career_path_name}</p>
                                                <p className={`text-xl font-extrabold ${scoreColor} mt-1`}>{path.score}% Ready</p>
                                            </div>
                                        </div>
                                        <ChevronRight className={`w-5 h-5 text-slate-300 flex-shrink-0 transition-transform ${isOpen ? "rotate-90" : ""}`} />
                                    </button>

                                    {/* Expanded Detail */}
                                    {isOpen && (
                                        <div className="px-5 pb-5 space-y-5 border-t border-white/40">
                                            {/* Component breakdown */}
                                            <div className="space-y-3 pt-4">
                                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                                                    <TrendingUp className="w-3.5 h-3.5" /> Score Breakdown
                                                </p>
                                                <ComponentBar label="Skills Match (35%)" value={path.skills_score} color="bg-blue-400" />
                                                <ComponentBar label="Activity Score (35%)" value={path.activity_score} color="bg-violet-400" />
                                                <ComponentBar label="Learning Score (20%)" value={path.learning_score} color="bg-emerald-400" />
                                                <ComponentBar label="Recency Bonus (10%)" value={path.recency_bonus} color="bg-amber-400" />
                                            </div>

                                            {/* Gaps */}
                                            {path.gaps.length > 0 && (
                                                <div className="space-y-2">
                                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                                                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500" /> Gaps
                                                    </p>
                                                    {path.gaps.map((gap, i) => (
                                                        <div key={i} className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
                                                            <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                                                            <p className="text-xs text-amber-800">{gap}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Next Actions */}
                                            <div className="space-y-2">
                                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                                                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> Next Best Actions
                                                </p>
                                                {path.next_actions.map((action, i) => (
                                                    <div key={i} className="flex items-start gap-2 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2">
                                                        <CheckCircle className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                                                        <p className="text-xs text-emerald-800">{action}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}

                        {data.length === 0 && (
                            <div className="text-center py-16">
                                <p className="text-slate-400 text-sm">Add career paths during onboarding to see your readiness scores.</p>
                                <Link href="/onboarding" className="inline-block mt-4 bg-primary text-white text-xs font-semibold px-6 py-2.5 rounded-xl hover:bg-primary/90 transition-colors">
                                    Complete Onboarding
                                </Link>
                            </div>
                        )}
                    </div>
                )}
            </div>
            <BottomNav />
        </main>
    );
}
