"use client";

import Link from "next/link";
import { ArrowLeft, Award, CheckCircle2, Circle, Clock, ExternalLink, HelpCircle, Loader2, Sparkles, XCircle } from "lucide-react";
import { BottomNav } from "@/components/ui/BottomNav";
import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";

interface AuditEntry {
    criteria: string;
    status: "eligible" | "ineligible" | "unknown";
    notes: string;
}

interface Scholarship {
    id?: string;
    scholarship_name: string;
    provider: string;
    financial_benefit: string;
    deadline?: string;
    eligibility_status: "pending" | "eligible" | "ineligible";
    audit_notes_json: AuditEntry[];
    parent_recommended: boolean;
    application_status: string;
}

export default function ScholarshipHub() {
    const [scholarships, setScholarships] = useState<Scholarship[]>([]);
    const [matches, setMatches] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSearching, setIsSearching] = useState(false);
    const [isAuditing, setIsAuditing] = useState<string | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [trackedRes, matchesRes] = await Promise.all([
                apiFetch("/scholarships/tracked"),
                apiFetch("/scholarships/matches")
            ]);
            setScholarships(trackedRes.scholarships || []);
            setMatches(matchesRes.matches || []);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleTrack = async (match: any) => {
        try {
            await apiFetch("/scholarships/track", {
                method: "POST",
                body: JSON.stringify({
                    scholarship_name: match.name,
                    provider: match.provider,
                    financial_benefit: match.benefit,
                    deadline: match.deadline
                })
            });
            await fetchData();
        } catch (e) {
            console.error(e);
        }
    };

    const handleAudit = async (id: string) => {
        setIsAuditing(id);
        try {
            await apiFetch(`/scholarships/${id}/audit`, { method: "POST" });
            await fetchData();
        } catch (e) {
            console.error(e);
        } finally {
            setIsAuditing(null);
        }
    };

    const StatusBadge = ({ status }: { status: string }) => {
        const colors = {
            eligible: "bg-emerald-50 text-emerald-700 border-emerald-100",
            ineligible: "bg-red-50 text-red-700 border-red-100",
            pending: "bg-amber-50 text-amber-700 border-amber-100"
        };
        const colorClass = colors[status as keyof typeof colors] || colors.pending;
        return (
            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border uppercase tracking-wider ${colorClass}`}>
                {status}
            </span>
        );
    };

    return (
        <main className="min-h-screen bg-slate-50 pb-24">
            <div className="max-w-2xl mx-auto px-4 py-6">
                {/* Header */}
                <header className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <Link href="/readiness" className="p-2 hover:bg-white rounded-xl transition-colors text-slate-500 shadow-sm">
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <div>
                            <h1 className="text-xl font-bold text-slate-900">Scholarship Hub</h1>
                            <p className="text-xs text-slate-500 font-medium tracking-tight">Financial Aid & Localized Grants</p>
                        </div>
                    </div>
                </header>

                {isLoading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="w-8 h-8 text-primary animate-spin" />
                    </div>
                ) : (
                    <div className="space-y-8">
                        {/* Summary Stats */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
                                <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Tracked Aid</p>
                                <div className="text-2xl font-black text-slate-900">{scholarships.length}</div>
                            </div>
                            <div className="bg-emerald-600 p-4 rounded-3xl shadow-lg shadow-emerald-600/20 text-white">
                                <p className="text-[10px] font-black text-emerald-200 uppercase mb-1">Eligible Match</p>
                                <div className="text-2xl font-black">{scholarships.filter(s => s.eligibility_status === 'eligible').length}</div>
                            </div>
                        </div>

                        {/* AI Recommended Section */}
                        <section>
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-primary" />
                                    AI-Matched for You
                                </h2>
                                <p className="text-[10px] text-slate-400 font-medium">Updated 2m ago</p>
                            </div>
                            <div className="space-y-3">
                                {matches.map((m, i) => (
                                    <div key={i} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-start justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-sm font-bold text-slate-900 truncate">{m.name}</h3>
                                            <p className="text-[10px] font-medium text-slate-500">{m.provider} • {m.benefit}</p>
                                            <div className="flex gap-2 mt-2">
                                                <span className="text-[9px] font-bold bg-slate-50 text-slate-600 px-2 py-0.5 rounded-lg border border-slate-100 truncate max-w-[150px]">
                                                    {m.eligibility}
                                                </span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleTrack(m)}
                                            className="bg-slate-900 text-white p-2 rounded-xl hover:bg-slate-800 transition"
                                        >
                                            <Clock className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Tracked Scholarships with Audit */}
                        <section>
                            <h2 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                                <Award className="w-4 h-4 text-emerald-600" />
                                Your Scholarship Radar
                            </h2>
                            <div className="space-y-4">
                                {scholarships.map((s) => (
                                    <div key={s.id} className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm overflow-hidden relative">
                                        {s.parent_recommended && (
                                            <div className="absolute top-0 left-0 bg-primary/10 text-primary text-[9px] font-black px-3 py-1 rounded-br-2xl uppercase">
                                                Parent's Choice
                                            </div>
                                        )}
                                        <div className="flex items-start justify-between gap-4 pt-2">
                                            <div>
                                                <h3 className="font-bold text-slate-900 leading-tight mb-1">{s.scholarship_name}</h3>
                                                <p className="text-xs text-slate-500 font-medium truncate max-w-[200px]">{s.provider}</p>
                                            </div>
                                            <StatusBadge status={s.eligibility_status} />
                                        </div>

                                        <div className="mt-4 flex items-center gap-4 py-3 border-y border-slate-50">
                                            <div className="flex-1">
                                                <p className="text-[10px] font-black text-slate-400 uppercase mb-0.5">Benefit</p>
                                                <p className="text-xs font-bold text-emerald-600">{s.financial_benefit}</p>
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-[10px] font-black text-slate-400 uppercase mb-0.5">Deadline</p>
                                                <p className="text-xs font-bold text-slate-900">{s.deadline || "TBA"}</p>
                                            </div>
                                        </div>

                                        {/* Audit Toggle/Results */}
                                        {s.audit_notes_json && s.audit_notes_json.length > 0 ? (
                                            <div className="mt-4 space-y-2">
                                                {s.audit_notes_json.map((a, idx) => (
                                                    <div key={idx} className="flex items-start gap-2.5 bg-slate-50 p-3 rounded-2xl">
                                                        {a.status === 'eligible' ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5" /> :
                                                            a.status === 'ineligible' ? <XCircle className="w-3.5 h-3.5 text-red-500 mt-0.5" /> :
                                                                <HelpCircle className="w-3.5 h-3.5 text-amber-500 mt-0.5" />}
                                                        <div className="flex-1">
                                                            <p className="text-[11px] font-bold text-slate-800">{a.criteria}</p>
                                                            <p className="text-[10px] text-slate-500 mt-0.5">{a.notes}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => handleAudit(s.id!)}
                                                disabled={isAuditing === s.id}
                                                className="w-full mt-4 bg-slate-50 hover:bg-slate-100 text-slate-900 text-xs font-bold py-3 rounded-2xl transition flex items-center justify-center gap-2 border border-slate-100"
                                            >
                                                {isAuditing === s.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-primary" />}
                                                Verify Eligibility
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>
                )}
            </div>
            <BottomNav />
        </main>
    );
}
