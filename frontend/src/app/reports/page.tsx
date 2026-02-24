"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { BottomNav } from "@/components/ui/BottomNav";
import { Loader2, Calendar, TrendingUp, BookOpen, UserCheck, ChevronRight } from "lucide-react";

interface MonthlyReport {
    id: string;
    report_month: string;
    narrative_summary: string;
    metrics_snapshot: {
        activities_count: number;
        readiness_gain: number;
        current_readiness: number;
        parent_nudge_count: number;
    };
    created_at: string;
}

export default function ReportsPage() {
    const [reports, setReports] = useState<MonthlyReport[]>([]);
    const [selectedReport, setSelectedReport] = useState<MonthlyReport | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchReports() {
            try {
                const data = await apiFetch("/reports/monthly");
                setReports(data.reports || []);
                if (data.reports?.length > 0) {
                    setSelectedReport(data.reports[0]);
                }
            } catch (err) {
                console.error("Failed to fetch reports", err);
            } finally {
                setLoading(false);
            }
        }
        fetchReports();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-surface">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-surface">
            {/* Top Bar */}
            <header className="sticky top-0 z-40 glass border-b border-white/40 px-4 py-4">
                <div className="max-w-2xl mx-auto">
                    <h1 className="font-bold text-slate-800 text-lg">Career Progress Reports</h1>
                    <p className="text-xs text-slate-400">Monthly synthesis from your Chief AI Mentor</p>
                </div>
            </header>

            <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
                {reports.length === 0 ? (
                    <div className="glass p-12 text-center text-slate-400">
                        <Calendar className="w-12 h-12 mx-auto mb-4 opacity-20" />
                        <p className="text-sm font-medium">Your first monthly report will be generated on the 1st of next month!</p>
                    </div>
                ) : (
                    <>
                        {/* Month Selector */}
                        <div className="flex gap-2 overflow-x-auto pb-2">
                            {reports.map((r) => (
                                <button
                                    key={r.id}
                                    onClick={() => setSelectedReport(r)}
                                    className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${selectedReport?.id === r.id
                                            ? "bg-slate-800 text-white border-slate-800 shadow-md"
                                            : "bg-white text-slate-500 border-slate-100"
                                        }`}
                                >
                                    {new Date(r.report_month + "-01").toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
                                </button>
                            ))}
                        </div>

                        {selectedReport && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                {/* Highlights Grid */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="glass-sm p-4 border-l-4 border-primary">
                                        <div className="flex items-center gap-2 mb-1">
                                            <BookOpen className="w-4 h-4 text-primary" />
                                            <span className="text-[10px] uppercase font-bold text-slate-400">Activities</span>
                                        </div>
                                        <p className="text-2xl font-black text-slate-800">{selectedReport.metrics_snapshot.activities_count}</p>
                                        <p className="text-[10px] text-slate-400">Completed this month</p>
                                    </div>
                                    <div className="glass-sm p-4 border-l-4 border-accent">
                                        <div className="flex items-center gap-2 mb-1">
                                            <TrendingUp className="w-4 h-4 text-accent" />
                                            <span className="text-[10px] uppercase font-bold text-slate-400">Readiness Gap</span>
                                        </div>
                                        <p className="text-2xl font-black text-slate-800">
                                            {selectedReport.metrics_snapshot.readiness_gain >= 0 ? "+" : ""}{selectedReport.metrics_snapshot.readiness_gain}%
                                        </p>
                                        <p className="text-[10px] text-slate-400">Change in readiness</p>
                                    </div>
                                </div>

                                {/* Narrative Card */}
                                <div className="glass p-6 text-slate-700 leading-relaxed relative overflow-hidden">
                                    {/* Decorative Icon */}
                                    <div className="absolute -right-4 -bottom-4 opacity-5">
                                        <Award className="w-32 h-32" />
                                    </div>

                                    <h3 className="font-black text-slate-800 text-xl mb-4 flex items-center gap-2">
                                        <UserCheck className="w-6 h-6 text-primary" />
                                        Chief Mentor's Letter
                                    </h3>

                                    <div className="space-y-4 text-sm whitespace-pre-line">
                                        {selectedReport.narrative_summary}
                                    </div>

                                    <div className="mt-8 pt-4 border-t border-slate-100 flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                        <span>SARGVISION AI · MENTORSHIP ORECHESTRATOR</span>
                                        <span>REF: {selectedReport.id.slice(0, 8)}</span>
                                    </div>
                                </div>

                                {/* Parent Contribution */}
                                {selectedReport.metrics_snapshot.parent_nudge_count > 0 && (
                                    <div className="glass-sm p-4 bg-accent/5 border border-accent/20">
                                        <p className="text-xs font-bold text-accent">Parental Support</p>
                                        <p className="text-xs text-slate-600">
                                            This month's progress was influenced by <b>{selectedReport.metrics_snapshot.parent_nudge_count}</b> personalized nudges from your parent/guardian.
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}
            </main>

            <div className="h-20" />
            <BottomNav />
        </div>
    );
}

const Award = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="7" /><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" /></svg>
);
