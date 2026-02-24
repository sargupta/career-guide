"use client";

import Link from "next/link";
import { BottomNav } from "@/components/ui/BottomNav";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { Loader2 } from "lucide-react";

// Mock data — replace with real API calls
const user = { name: "Arjun", year: 2, totalYears: 4, domain: "Engineering & Technology" };
const readiness = [
    { path: "Software Engineer", pct: 72, color: "bg-primary" },
    { path: "Product Manager", pct: 51, color: "bg-amber-400" },
];
const recentActivities = [
    { emoji: "🏆", title: "IEEE SRM Hackathon", detail: "2nd Place · Sem 1, Year 2" },
    { emoji: "💼", title: "TechCorp Internship", detail: "Backend Dev · Summer Year 1" },
    { emoji: "📚", title: "Google Data Analytics", detail: "Certification · Year 1" },
];
const opportunities = [
    { title: "Google Summer Intern 2026", match: 84, type: "Internship", badgeColor: "bg-primary" },
    { title: "NASSCOM Scholarship", match: 71, type: "Scholarship", badgeColor: "bg-accent" },
];

interface NextAction {
    nba_type: string;
    title: string;
    message: string;
    cta_label: string;
    cta_link: string;
}

interface UserSummary {
    streak: number;
    xp: number;
    pending_nudge: string | null;
    activity_count: number;
}

export default function DashboardPage() {
    const [nextAction, setNextAction] = useState<NextAction | null>(null);
    const [summary, setSummary] = useState<UserSummary | null>(null);
    const [loadingNba, setLoadingNba] = useState(true);

    useEffect(() => {
        async function fetchData() {
            try {
                const [nbaData, summaryData] = await Promise.all([
                    apiFetch("/api/dashboard/next-action"),
                    apiFetch("/api/dashboard/summary")
                ]);
                setNextAction(nbaData);
                setSummary(summaryData);
            } catch (err) {
                console.error("Failed to load dashboard data", err);
            } finally {
                setLoadingNba(false);
            }
        }
        fetchData();
    }, []);

    return (
        <div className="min-h-screen bg-surface">
            {/* Top bar */}
            <header className="sticky top-0 z-40 glass border-b border-white/40 px-4 py-4">
                <div className="max-w-2xl mx-auto flex items-center justify-between">
                    <div>
                        <p className="font-bold text-slate-800">Good morning, {user.name} 👋</p>
                        <p className="text-xs text-slate-400">
                            Completing Year {user.year} of {user.totalYears} · {user.domain}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        {summary && summary.streak > 0 && (
                            <div className="flex items-center gap-1 bg-orange-100 text-orange-600 px-2 py-1 rounded-full text-xs font-bold border border-orange-200 animate-pulse">
                                🔥 {summary.streak}
                            </div>
                        )}
                        <Link href="/settings" className="text-slate-400 hover:text-slate-600 transition-colors text-xs font-medium px-2 py-1 hover:bg-slate-100 rounded-lg">
                            ⚙️
                        </Link>
                        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                            {user.name[0]}
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-2xl mx-auto px-4 py-6 space-y-5">
                {/* Readiness snapshot */}
                <div className="glass p-5 border-t-2 border-primary">
                    <div className="flex justify-between items-center mb-4">
                        <p className="font-bold text-slate-800">Your Readiness</p>
                        <Link href="/digital-twin" className="text-xs text-primary font-semibold hover:underline">View Details →</Link>
                    </div>
                    <div className="space-y-3">
                        {readiness.map((r) => (
                            <div key={r.path}>
                                <div className="flex justify-between text-xs font-medium text-slate-600 mb-1">
                                    <span>{r.path}</span>
                                    <span className="font-bold text-primary">{r.pct}%</span>
                                </div>
                                <div className="readiness-bar">
                                    <div className={`readiness-bar-fill ${r.color}`} style={{ width: `${r.pct}%` }} />
                                </div>
                            </div>
                        ))}
                    </div>
                    <p className="text-xs text-slate-400 mt-3">Based on your skills, activities &amp; learning</p>
                </div>

                {/* Quick stats */}
                <div className="grid grid-cols-3 gap-3">
                    {[
                        { label: "Activities", value: summary?.activity_count.toString() || "8", sub: "this month" },
                        { label: "Skills", value: "5", sub: "verified" },
                        { label: "Courses", value: "3", sub: "in progress" },
                    ].map((s) => (
                        <div key={s.label} className="glass-sm p-4 text-center">
                            <p className="text-2xl font-extrabold text-primary">{s.value}</p>
                            <p className="text-xs font-semibold text-slate-700">{s.label}</p>
                            <p className="text-xs text-slate-400">{s.sub}</p>
                        </div>
                    ))}
                </div>

                {/* Persona Nudge (Retention) */}
                {summary?.pending_nudge && (
                    <div className="glass p-5 border-l-4 border-primary bg-primary/5">
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-xl shadow-sm">
                                🧑‍🏫
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-primary uppercase tracking-wider mb-0.5">Mentor Note</p>
                                <p className="text-sm text-slate-700 italic">"{summary.pending_nudge}"</p>
                                <Link href="/mentor" className="text-xs text-primary font-bold mt-2 inline-block hover:underline">Reply to Mentor →</Link>
                            </div>
                        </div>
                    </div>
                )}

                {/* Next Best Action Card (Top Priority) */}
                <div className="glass p-5 border-l-4 border-accent relative overflow-hidden">
                    {/* Decorative gradient orb */}
                    <div className="absolute -right-8 -top-8 w-24 h-24 bg-accent/20 blur-2xl rounded-full" />

                    <div className="flex items-start gap-3 relative z-10">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-xl flex-shrink-0 shadow-lg text-white">
                            {nextAction?.nba_type === "streak_rescue" ? "🔥" :
                                nextAction?.nba_type === "level_up" ? "⭐" :
                                    nextAction?.nba_type === "dormant_user" ? "📅" : "🎯"}
                        </div>
                        <div className="flex-1">
                            <p className="text-[10px] font-extrabold text-accent uppercase tracking-wider mb-1">Recommended Action</p>

                            {loadingNba ? (
                                <div className="space-y-2 py-2">
                                    <div className="h-4 bg-slate-200/50 rounded animate-pulse w-3/4" />
                                    <div className="h-3 bg-slate-200/50 rounded animate-pulse w-full" />
                                    <div className="h-3 bg-slate-200/50 rounded animate-pulse w-5/6" />
                                </div>
                            ) : nextAction ? (
                                <>
                                    <h3 className="text-sm font-bold text-slate-800 mb-1 leading-snug">{nextAction.title}</h3>
                                    <p className="text-xs text-slate-600 mb-3">{nextAction.message}</p>
                                    <div className="flex flex-wrap gap-2">
                                        <Link href={nextAction.cta_link} className="text-xs font-bold bg-slate-800 text-white shadow-md rounded-lg px-4 py-2 hover:bg-slate-700 transition">
                                            {nextAction.cta_label}
                                        </Link>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <h3 className="text-sm font-bold text-slate-800 mb-1 leading-snug">Boost your Career Profile</h3>
                                    <p className="text-xs text-slate-600 mb-3">Check in with your Lead Mentor for personalized advice.</p>
                                    <div className="flex flex-wrap gap-2">
                                        <Link href="/mentor" className="text-xs font-bold bg-slate-800 text-white shadow-md rounded-lg px-4 py-2 hover:bg-slate-700 transition">
                                            Chat with Mentor
                                        </Link>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>


                {/* Recent activities */}
                <div className="glass p-5">
                    <div className="flex justify-between items-center mb-4">
                        <p className="font-bold text-slate-800">Recent Activity</p>
                        <Link href="/timeline" className="text-xs text-primary font-semibold hover:underline">View All →</Link>
                    </div>
                    <div className="space-y-3">
                        {recentActivities.map((a) => (
                            <div key={a.title} className="flex items-center gap-3 py-2 border-b border-slate-50 last:border-0">
                                <span className="text-xl">{a.emoji}</span>
                                <div>
                                    <p className="text-sm font-semibold text-slate-800">{a.title}</p>
                                    <p className="text-xs text-slate-400">{a.detail}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Opportunity preview */}
                <div>
                    <div className="flex justify-between items-center mb-3">
                        <p className="font-bold text-slate-800">Opportunities for You</p>
                        <Link href="/opportunities" className="text-xs text-primary font-semibold hover:underline">View All →</Link>
                    </div>
                    <div className="flex gap-3 overflow-x-auto pb-1">
                        {opportunities.map((o) => (
                            <div key={o.title} className="glass-sm p-4 flex-shrink-0 w-64">
                                <div className="flex justify-between items-start mb-2">
                                    <span className={`text-xs font-bold text-white ${o.badgeColor} px-2 py-0.5 rounded-full`}>{o.type}</span>
                                    <span className="text-lg font-extrabold text-primary">{o.match}%</span>
                                </div>
                                <p className="text-sm font-semibold text-slate-800 leading-snug">{o.title}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </main>

            <BottomNav />

            <div className="h-20" />
        </div>
    );
}
