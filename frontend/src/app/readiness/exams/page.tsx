"use client";

import Link from "next/link";
import { ArrowLeft, Calendar, CheckCircle2, Circle, Clock, LayoutGrid, Loader2, Sparkles, TrendingUp } from "lucide-react";
import { BottomNav } from "@/components/ui/BottomNav";
import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";

interface SyllabusComponent {
    subject: string;
    topics: string[];
    weightage: "high" | "medium" | "low";
    progress_pct?: number; // Simulated/Derived
}

interface UserExam {
    id: string;
    exam_type: string;
    target_date: string;
    attempt_number: number;
    status: "planning" | "preparing" | "reviewing" | "completed";
    syllabus_progress_json: SyllabusComponent[];
}

export default function GovtExamsPage() {
    const [exams, setExams] = useState<UserExam[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const [activeExamId, setActiveExamId] = useState<string | null>(null);

    useEffect(() => {
        fetchExams();
    }, []);

    const fetchExams = async () => {
        try {
            const data = await apiFetch("/exams/");
            setExams(data.exams || []);
            if (data.exams?.length > 0 && !activeExamId) {
                setActiveExamId(data.exams[0].id);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleGenerateSyllabus = async (examId: string) => {
        setIsGenerating(true);
        try {
            await apiFetch(`/exams/${examId}/syllabus`, { method: "POST" });
            await fetchExams();
        } catch (e) {
            console.error(e);
        } finally {
            setIsGenerating(false);
        }
    };

    const activeExam = exams.find(e => e.id === activeExamId);

    // Countdown logic
    const getDaysRemaining = (dateStr: string) => {
        const target = new Date(dateStr);
        const now = new Date();
        const diff = target.getTime() - now.getTime();
        return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
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
                            <h1 className="text-xl font-bold text-slate-900">Exam Mastery</h1>
                            <p className="text-xs text-slate-500 font-medium">Indian Government Exam Tracker</p>
                        </div>
                    </div>
                </header>

                {isLoading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="w-8 h-8 text-primary animate-spin" />
                    </div>
                ) : exams.length === 0 ? (
                    <div className="bg-white rounded-3xl p-8 text-center border border-slate-100 shadow-sm">
                        <div className="w-16 h-16 bg-primary/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <TrendingUp className="w-8 h-8 text-primary" />
                        </div>
                        <h2 className="text-lg font-bold text-slate-900 mb-2">No Exams Tracked</h2>
                        <p className="text-sm text-slate-500 mb-6">Start tracking your UPSC, GATE, or CAT journey with AI-driven syllabus breakdowns.</p>
                        <button className="bg-slate-900 text-white px-6 py-3 rounded-2xl text-sm font-bold hover:bg-slate-800 transition shadow-lg shadow-slate-900/10">
                            Add Target Exam
                        </button>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Exam Tabs */}
                        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                            {exams.map(e => (
                                <button
                                    key={e.id}
                                    onClick={() => setActiveExamId(e.id)}
                                    className={`flex-shrink-0 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all border ${activeExamId === e.id
                                            ? "bg-slate-900 text-white border-slate-900 shadow-md"
                                            : "bg-white text-slate-500 border-slate-200 hover:border-slate-400"
                                        }`}
                                >
                                    {e.exam_type} {new Date(e.target_date).getFullYear()}
                                </button>
                            ))}
                        </div>

                        {activeExam && (
                            <>
                                {/* Countdown Card */}
                                <div className="bg-slate-900 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-3xl -mr-16 -mt-16" />
                                    <div className="relative z-10 flex items-center justify-between">
                                        <div>
                                            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Target Exam Day</p>
                                            <h2 className="text-2xl font-black mb-1">{activeExam.exam_type} {new Date(activeExam.target_date).getFullYear()}</h2>
                                            <div className="flex items-center gap-2 text-slate-300">
                                                <Calendar className="w-3.5 h-3.5" />
                                                <span className="text-xs font-semibold">{new Date(activeExam.target_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-4xl font-black text-primary">{getDaysRemaining(activeExam.target_date)}</div>
                                            <p className="text-slate-400 text-[10px] font-bold uppercase">Days to go</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Syllabus Breakdown Header */}
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                        <LayoutGrid className="w-4 h-4 text-primary" />
                                        Syllabus Breakdown
                                    </h3>
                                    <button
                                        onClick={() => handleGenerateSyllabus(activeExam.id)}
                                        disabled={isGenerating}
                                        className="text-[10px] font-extrabold text-primary bg-primary/10 px-3 py-1.5 rounded-full hover:bg-primary/20 transition disabled:opacity-50 flex items-center gap-1.5"
                                    >
                                        {isGenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                                        AI Refresh
                                    </button>
                                </div>

                                {/* Syllabus Progress */}
                                {activeExam.syllabus_progress_json?.length > 0 ? (
                                    <div className="space-y-3">
                                        {activeExam.syllabus_progress_json.map((s, idx) => (
                                            <div key={idx} className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm hover:border-primary/30 transition-colors">
                                                <div className="flex items-start justify-between mb-3">
                                                    <div>
                                                        <h4 className="text-sm font-bold text-slate-800">{s.subject}</h4>
                                                        <div className="flex gap-2 mt-1">
                                                            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${s.weightage === 'high' ? 'bg-red-50 text-red-600' :
                                                                    s.weightage === 'medium' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'
                                                                }`}>
                                                                {s.weightage} Weightage
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="text-xs font-black text-slate-900">{(s.progress_pct || 0)}%</span>
                                                        <p className="text-[10px] text-slate-400 font-bold uppercase">Progress</p>
                                                    </div>
                                                </div>

                                                {/* Topics Grid */}
                                                <div className="flex flex-wrap gap-1.5">
                                                    {s.topics.map((t, tIdx) => (
                                                        <span key={tIdx} className="text-[10px] text-slate-500 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-lg">
                                                            {t}
                                                        </span>
                                                    ))}
                                                </div>

                                                <div className="mt-4 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-primary transition-all duration-1000"
                                                        style={{ width: `${s.progress_pct || 0}%` }}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-8 text-center">
                                        <p className="text-sm text-slate-400 mb-4 italic">No syllabus components found. Generate one using AI!</p>
                                        <button
                                            onClick={() => handleGenerateSyllabus(activeExam.id)}
                                            disabled={isGenerating}
                                            className="bg-primary text-white text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-emerald-600 transition flex items-center gap-2 mx-auto"
                                        >
                                            {isGenerating && <Loader2 className="w-3 h-3 animate-spin" />}
                                            Initialize AI Syllabus
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}
            </div>

            <BottomNav />
        </main>
    );
}
