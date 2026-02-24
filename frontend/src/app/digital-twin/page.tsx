"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { BottomNav } from "@/components/ui/BottomNav";
import { gamificationApi } from "@/lib/api";
import { useEffect } from "react";

const skills = [
    { name: "Python", level: 85, category: "Technical" },
    { name: "JavaScript", level: 72, category: "Technical" },
    { name: "SQL", level: 68, category: "Technical" },
    { name: "System Design", level: 45, category: "Technical" },
    { name: "Leadership", level: 78, category: "Soft Skills" },
    { name: "Communication", level: 82, category: "Soft Skills" },
    { name: "Problem Solving", level: 88, category: "Soft Skills" },
];

const coreInfo = [
    { label: "Degree", value: "B.Tech – Computer Science" },
    { label: "Institution", value: "SRM Institute of Science and Technology" },
    { label: "Year", value: "Year 2 of 4" },
    { label: "Academic Year Start", value: "2022" },
    { label: "Domain", value: "Engineering & Technology" },
    { label: "Aspirations", value: "Software Engineer, Product Manager" },
];

export default function DigitalTwinPage() {
    const [activeTab, setActiveTab] = useState("overview");
    const [gamification, setGamification] = useState<any>(null);

    useEffect(() => {
        const fetchGamification = async () => {
            try {
                const res = await gamificationApi.getProfile();
                setGamification(res.data);
            } catch (err) {
                console.error("Failed to fetch gamification profile", err);
            }
        };
        fetchGamification();
    }, []);

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
                                <h1 className="font-bold text-slate-800">Your Digital Twin</h1>
                                <p className="text-xs text-slate-400">Real-time model of your career journey</p>
                            </div>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-6 mt-3 border-b border-slate-100">
                        {[
                            { id: "overview", label: "Overview" },
                            { id: "gamification", label: "Trophy Room" },
                            { id: "skills", label: "Skills" },
                            { id: "core", label: "Core Profile" },
                        ].map(({ id, label }) => (
                            <button
                                key={id}
                                onClick={() => setActiveTab(id)}
                                className={`pb-2.5 text-sm font-semibold transition-all ${activeTab === id
                                    ? "text-primary border-b-2 border-primary -mb-px"
                                    : "text-slate-400"
                                    }`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </header>

                {/* ── Overview Tab ── */}
                {activeTab === "overview" && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                        {/* Readiness Gauge */}
                        <div className="glass p-6 rounded-2xl">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h2 className="font-bold text-slate-800">Software Engineer</h2>
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-medium mt-1.5">
                                        On Track 🟢
                                    </span>
                                </div>
                                <span className="text-xs text-slate-400 text-right">Primary Path</span>
                            </div>

                            <div className="flex items-center justify-center py-2">
                                <div className="relative w-36 h-36 flex items-center justify-center">
                                    <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                                        <circle cx="50" cy="50" r="42" fill="none" stroke="#f1f5f9" strokeWidth="8" />
                                        <circle cx="50" cy="50" r="42" fill="none" stroke="#0d9488" strokeWidth="8"
                                            strokeDasharray="264" strokeDashoffset={264 - (264 * 72) / 100}
                                            className="transition-all duration-1000 ease-out"
                                            strokeLinecap="round" />
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <span className="text-4xl font-extrabold text-primary">72%</span>
                                        <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">Readiness</span>
                                    </div>
                                </div>
                            </div>

                            <p className="text-slate-500 text-xs text-center mt-2">
                                Based on your skills, activities, and learning progress.
                            </p>
                        </div>

                        {/* Career Paths Comparison */}
                        <div className="glass p-5 rounded-2xl">
                            <h2 className="font-bold text-slate-800 mb-4">Career Path Readiness</h2>
                            <div className="space-y-4">
                                {[
                                    { role: "Software Engineer", pct: 72, color: "bg-primary" },
                                    { role: "Product Manager", pct: 51, color: "bg-amber-400" },
                                    { role: "Data Scientist", pct: 38, color: "bg-violet-400" },
                                ].map(({ role, pct, color }) => (
                                    <div key={role}>
                                        <div className="flex justify-between text-xs font-medium text-slate-600 mb-1.5">
                                            <span>{role}</span>
                                            <span className="font-bold text-slate-800">{pct}%</span>
                                        </div>
                                        <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                                            <div className={`h-full rounded-full ${color} transition-all duration-700`} style={{ width: `${pct}%` }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Quick actions */}
                        <div className="grid grid-cols-2 gap-3">
                            <Link href="/mentor" className="glass p-4 rounded-2xl text-center hover:shadow-md transition-shadow">
                                <div className="text-2xl mb-1">✨</div>
                                <p className="text-sm font-bold text-slate-800">Ask Mentor</p>
                                <p className="text-xs text-slate-400">Get personalized guidance</p>
                            </Link>
                            <Link href="/timeline" className="glass p-4 rounded-2xl text-center hover:shadow-md transition-shadow">
                                <div className="text-2xl mb-1">📅</div>
                                <p className="text-sm font-bold text-slate-800">Log Activity</p>
                                <p className="text-xs text-slate-400">Keep your twin updated</p>
                            </Link>
                        </div>
                    </div>
                )}

                {/* ── Skills Tab ── */}
                {activeTab === "skills" && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                        {/* Group by category */}
                        {["Technical", "Soft Skills"].map((cat) => (
                            <div key={cat} className="glass p-5 rounded-2xl">
                                <h2 className="font-bold text-slate-800 mb-4">{cat}</h2>
                                <div className="space-y-4">
                                    {skills.filter(s => s.category === cat).map(({ name, level }) => (
                                        <div key={name}>
                                            <div className="flex justify-between text-sm font-medium text-slate-700 mb-1.5">
                                                <span>{name}</span>
                                                <span className="text-primary font-bold">{level}%</span>
                                            </div>
                                            <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                                                <div
                                                    className="h-full rounded-full bg-primary transition-all duration-700"
                                                    style={{ width: `${level}%` }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}

                        {/* Gap Analysis Nudge */}
                        <div className="glass p-4 rounded-2xl bg-amber-50/50 border border-amber-100">
                            <p className="text-xs font-bold text-amber-700 flex items-center gap-1.5 mb-1">
                                ⚠️ Skill Gap Alert
                            </p>
                            <p className="text-sm text-slate-700">
                                <strong>System Design</strong> is your lowest technical skill at 45%.
                                Your mentor has a learning path ready —
                                <Link href="/mentor" className="text-primary font-semibold ml-1 hover:underline">view it →</Link>
                            </p>
                        </div>
                    </div>
                )}

                {/* ── Core Profile Tab ── */}
                {activeTab === "core" && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                        <div className="glass p-5 rounded-2xl">
                            <h2 className="font-bold text-slate-800 mb-4">Academic Profile</h2>
                            <div className="space-y-3">
                                {coreInfo.map(({ label, value }) => (
                                    <div key={label} className="flex items-start justify-between gap-4 py-2 border-b border-slate-50 last:border-0">
                                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide flex-shrink-0">{label}</span>
                                        <span className="text-sm font-semibold text-slate-700 text-right">{value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Edit prompt */}
                        <div className="glass p-4 rounded-2xl border border-primary/20 bg-primary/5 text-center">
                            <p className="text-sm text-slate-600 mb-3">Want to update your profile info?</p>
                            <Link href="/onboarding" className="text-sm font-bold text-primary hover:underline">
                                Re-run Onboarding →
                            </Link>
                        </div>
                    </div>
                )}

                {/* ── Trophy Room Tab (Gamification) ── */}
                {activeTab === "gamification" && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                        {gamification ? (
                            <>
                                {/* Level & XP Card */}
                                <div className="glass p-6 rounded-2xl relative overflow-hidden">
                                    <div className="absolute right-0 top-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
                                    <div className="flex justify-between items-start mb-6 drop-shadow-sm">
                                        <div>
                                            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Current Rank</h2>
                                            <p className="text-3xl font-black text-slate-800 flex items-center gap-2 mt-1">
                                                Level {gamification.level_info?.level} <span className="text-xl">⭐</span>
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Total XP</p>
                                            <p className="font-bold text-primary text-xl mt-1">{gamification.xp}</p>
                                        </div>
                                    </div>

                                    {/* Progress Bar */}
                                    <div>
                                        <div className="flex justify-between text-xs font-medium text-slate-500 mb-1.5">
                                            <span>{gamification.xp} XP</span>
                                            <span>Next: {gamification.level_info?.next_level_xp} XP</span>
                                        </div>
                                        <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
                                            <div
                                                className="h-full rounded-full bg-primary transition-all duration-1000 ease-out"
                                                style={{ width: `${Math.min(100, Math.max(5, gamification.level_info?.progress_pct || 0))}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Streaks Card */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="glass p-5 rounded-2xl text-center">
                                        <p className="text-3xl mb-1">🔥</p>
                                        <p className="text-2xl font-black text-slate-800">{gamification.streak}</p>
                                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mt-1">Day Streak</p>
                                    </div>
                                    <div className="glass p-5 rounded-2xl text-center">
                                        <p className="text-3xl mb-1">🏆</p>
                                        <p className="text-2xl font-black text-slate-800">{gamification.max_streak}</p>
                                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mt-1">Best Streak</p>
                                    </div>
                                </div>

                                {/* Badges Grid */}
                                <div className="glass p-5 rounded-2xl">
                                    <h2 className="font-bold text-slate-800 mb-4 flex items-center justify-between">
                                        <span>Earned Badges</span>
                                        <span className="text-xs font-medium bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                                            {gamification.badges?.length || 0} Total
                                        </span>
                                    </h2>

                                    {gamification.badges?.length > 0 ? (
                                        <div className="grid grid-cols-3 gap-3">
                                            {gamification.badges.map((badge: any, idx: number) => (
                                                <div key={idx} className="bg-white/60 p-3 rounded-xl text-center border border-white/40 shadow-sm hover:scale-105 transition-transform">
                                                    <div className="text-3xl mb-1">{badge.icon_url}</div>
                                                    <p className="text-xs font-bold text-slate-800 leading-tight">{badge.badge_name}</p>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center p-6 border-2 border-dashed border-slate-200 rounded-xl">
                                            <p className="text-slate-400 text-sm">No badges earned yet.</p>
                                            <p className="text-xs text-slate-400 mt-1">Complete activities to unlock them!</p>
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="glass p-8 rounded-2xl text-center">
                                <span className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin inline-block"></span>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <BottomNav />
        </main>
    );
}
