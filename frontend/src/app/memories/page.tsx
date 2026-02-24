"use client";

import React, { useEffect, useState } from "react";
import {
    Brain,
    Target,
    ShieldAlert,
    GraduationCap,
    Briefcase,
    Zap,
    Trash2,
    ChevronRight,
    RefreshCw,
    Search,
    Filter,
    UserCheck
} from "lucide-react";
import { mentorApi } from "@/lib/api";
import { GlassCard } from "@/components/ui/GlassCard";

interface Memory {
    id: string;
    memory: string;
    created_at: string;
    metadata?: {
        category?: string;
        valid_until?: string;
    };
}

const CATEGORY_MAP: Record<string, { icon: any; color: string; label: string }> = {
    ACADEMIC: { icon: GraduationCap, color: "text-blue-600 bg-blue-50", label: "Academic" },
    BLOCKERS: { icon: ShieldAlert, color: "text-rose-600 bg-rose-50", label: "Blocker" },
    GOALS: { icon: Target, color: "text-amber-600 bg-amber-50", label: "Goal" },
    SKILLS: { icon: Zap, color: "text-emerald-600 bg-emerald-50", label: "Skill" },
    EXPERIENCE: { icon: Briefcase, color: "text-indigo-600 bg-indigo-50", label: "Experience" },
    CAREER_PREF: { icon: ChevronRight, color: "text-purple-600 bg-purple-50", label: "Preference" },
    PERSONA: { icon: UserCheck, color: "text-teal-600 bg-teal-50", label: "Persona" },
};

export default function MemoryDashboard() {
    const [memories, setMemories] = useState<Memory[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<string>("ALL");
    const [searchQuery, setSearchQuery] = useState("");

    const fetchMemories = async () => {
        setLoading(true);
        try {
            const data = await mentorApi.getMemories();
            const sorted = (data.memories || []).sort((a: any, b: any) =>
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            );
            setMemories(sorted);
        } catch (err) {
            console.error("Failed to fetch memories:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMemories();
    }, []);

    const handleDeleteAll = async () => {
        if (!confirm("Are you sure you want to clear all career memories? This cannot be undone.")) return;
        try {
            await mentorApi.deleteMemories();
            setMemories([]);
        } catch (err) {
            alert("Failed to delete memories.");
        }
    };

    const filteredMemories = memories.filter(m => {
        const text = m.memory.toLowerCase();
        const query = searchQuery.toLowerCase();
        const matchesSearch = text.includes(query);
        const cat = m.metadata?.category || "OTHER";
        const matchesFilter = filter === "ALL" || cat === filter;
        return matchesSearch && matchesFilter;
    });

    const categories = ["ALL", ...Object.keys(CATEGORY_MAP)];

    return (
        <div className="min-h-screen pt-24 pb-12 px-4 md:px-8 max-w-6xl mx-auto">
            {/* ── Header ────────────────────────────────────────────────────────── */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 animate-fade-up">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2.5 bg-emerald-600 rounded-xl text-white shadow-lg shadow-emerald-200">
                            <Brain size={28} />
                        </div>
                        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Career Memory</h1>
                    </div>
                    <p className="text-slate-500 max-w-xl">
                        SARGVISION AI remembers key facts about your career journey to provide hyper-personalised guidance.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={fetchMemories}
                        className="p-2.5 glass-sm text-slate-600 hover:text-emerald-600 transition-colors"
                        title="Refresh"
                    >
                        <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
                    </button>
                    <button
                        onClick={handleDeleteAll}
                        className="flex items-center gap-2 px-4 py-2.5 bg-rose-50 text-rose-600 border border-rose-100 rounded-xl hover:bg-rose-100 transition-all font-medium text-sm"
                    >
                        <Trash2 size={16} />
                        Forget All
                    </button>
                </div>
            </div>

            {/* ── Controls ──────────────────────────────────────────────────────── */}
            <div className="flex flex-col gap-6 mb-8 stagger-children">
                <div className="flex flex-wrap gap-2">
                    {categories.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setFilter(cat)}
                            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${filter === cat
                                ? "bg-emerald-600 text-white shadow-md shadow-emerald-100 scale-105"
                                : "bg-white text-slate-500 hover:bg-emerald-50 hover:text-emerald-600 border border-slate-100"
                                }`}
                        >
                            {cat === "ALL" ? "All Facts" : CATEGORY_MAP[cat]?.label || cat}
                        </button>
                    ))}
                </div>

                <div className="relative group max-w-md">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-emerald-500" size={18} />
                    <input
                        type="text"
                        placeholder="Search your career history..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 glass rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all shadow-sm"
                    />
                </div>
            </div>

            {/* ── Grid ──────────────────────────────────────────────────────────── */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
                    {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-32 glass rounded-2xl" />)}
                </div>
            ) : filteredMemories.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 stagger-children">
                    {filteredMemories.map((m) => {
                        const rawCat = m.metadata?.category || "OTHER";
                        const catInfo = CATEGORY_MAP[rawCat] || { icon: Brain, color: "text-slate-600 bg-slate-50", label: "General" };
                        const Icon = catInfo.icon;

                        // Format memory text: Strip the "CATEGORY: " prefix if present
                        const displayMemo = m.memory.includes(":") ? m.memory.split(":")[1].trim() : m.memory;

                        const handleSingleDelete = async () => {
                            if (confirm("Forget this career fact?")) {
                                try {
                                    await mentorApi.deleteMemory(m.id);
                                    setMemories(prev => prev.filter(p => p.id !== m.id));
                                } catch (err) {
                                    alert("Failed to delete memory.");
                                }
                            }
                        };

                        return (
                            <GlassCard key={m.id} className="group hover:-translate-y-1 transition-all duration-300 relative">
                                <div className="flex items-start gap-4 h-full">
                                    <div className={`p-2.5 rounded-xl ${catInfo.color} shrink-0`}>
                                        <Icon size={20} />
                                    </div>
                                    <div className="flex flex-col justify-between h-full w-full">
                                        <div>
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                                    {catInfo.label}
                                                </span>
                                                <span className="text-[10px] text-slate-400">
                                                    {new Date(m.created_at).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <p className="text-sm text-slate-700 leading-relaxed font-medium pr-6">
                                                {displayMemo}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Single Delete Button - Only visible on hover */}
                                <button
                                    onClick={handleSingleDelete}
                                    className="absolute top-4 right-4 p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                    title="Forget this fact"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </GlassCard>
                        );
                    })}
                </div>
            ) : (
                <div className="text-center py-24 glass rounded-3xl animate-fade-up">
                    <div className="inline-flex p-5 bg-slate-50 rounded-full text-slate-300 mb-4">
                        <Filter size={48} />
                    </div>
                    <h3 className="text-xl font-semibold text-slate-800 mb-2">No memories found</h3>
                    <p className="text-slate-500 max-w-xs mx-auto">
                        {searchQuery ? "Try refining your search" : "Start chatting with your AI Mentor to build your career history."}
                    </p>
                </div>
            )}

            {/* ── Footer Info ───────────────────────────────────────────────────── */}
            <div className="mt-12 text-center text-[11px] text-slate-400 flex items-center justify-center gap-1.5 opacity-60">
                <ShieldAlert size={12} />
                All career facts are encrypted and stored in your private Digital Twin.
            </div>
        </div>
    );
}
