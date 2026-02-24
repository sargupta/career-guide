"use client";

import Link from "next/link";
import { ArrowLeft, BookOpen, ChevronRight, FileText, GraduationCap, LayoutDashboard, Library, Loader2, Plus, Presentation, Printer, Save, Send, Share2, Sparkles, Wand2, Users } from "lucide-react";
import { BottomNav } from "@/components/ui/BottomNav";
import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";

type AssetType = "quiz" | "lesson_plan";

export default function TeacherDashboard() {
    const [assets, setAssets] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState<AssetType | null>(null);
    const [impact, setImpact] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<AssetType>("quiz");

    // Form States
    const [topic, setTopic] = useState("");
    const [subject, setSubject] = useState("Science");
    const [grade, setGrade] = useState("10");

    useEffect(() => {
        fetchAssets();
    }, []);

    const fetchAssets = async () => {
        try {
            const [assetsRes, impactRes] = await Promise.all([
                apiFetch("/teacher/assets"),
                apiFetch("/teacher/impact")
            ]);
            setAssets(assetsRes.assets || []);
            setImpact(impactRes.metrics || null);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleGenerate = async (type: AssetType) => {
        if (!topic) return;
        setIsGenerating(type);
        try {
            const endpoint = type === "quiz" ? "/teacher/quiz/generate" : "/teacher/lesson/generate";
            await apiFetch(endpoint, {
                method: "POST",
                body: JSON.stringify({
                    topic,
                    subject,
                    grade_level: grade,
                    count: 5
                })
            });
            setTopic("");
            await fetchAssets();
        } catch (e) {
            console.error(e);
        } finally {
            setIsGenerating(null);
        }
    };

    return (
        <main className="min-h-screen bg-slate-50 pb-24">
            <div className="max-w-2xl mx-auto px-4 py-8">
                {/* Header */}
                <header className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
                            <GraduationCap className="text-white w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-slate-900 leading-none mb-1">Teacher Co-Pilot</h1>
                            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">SahayakAI Studio</p>
                        </div>
                    </div>
                </header>

                {/* Impact Summary */}
                <section className="grid grid-cols-2 gap-4 mb-8">
                    <div className="bg-slate-900 rounded-[2rem] p-5 text-white shadow-lg shadow-slate-900/10">
                        <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Hours Reclaimed</p>
                        <div className="flex items-center gap-2">
                            <span className="text-2xl font-black">{impact?.hours_reclaimed || 0}</span>
                            <span className="text-xs font-bold text-emerald-400">Total</span>
                        </div>
                    </div>
                    <div className="bg-white rounded-[2rem] p-5 border border-slate-100 shadow-sm overflow-hidden relative">
                        <div className="absolute top-0 right-0 p-4 opacity-5">
                            <Share2 className="w-12 h-12 text-primary" />
                        </div>
                        <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Community Impact</p>
                        <div className="flex items-center gap-2">
                            <span className="text-2xl font-black text-slate-900">{impact?.community_impact || 0}</span>
                            <span className="text-xs font-bold text-primary">Remixes</span>
                        </div>
                    </div>
                </section>

                {/* Generator Card */}
                <section className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-100 mb-8 overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-8 opacity-5">
                        <Sparkles className="w-24 h-24 text-primary" />
                    </div>

                    <h2 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
                        <Wand2 className="w-5 h-5 text-primary" />
                        Classroom Architect
                    </h2>

                    <div className="space-y-4 relative z-10">
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase ml-2 mb-1.5 block">What are we teaching?</label>
                            <input
                                value={topic}
                                onChange={(e) => setTopic(e.target.value)}
                                placeholder="e.g. Photosynthesis, Motion, Ancient India..."
                                className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-bold text-slate-900 placeholder:text-slate-300 focus:ring-2 focus:ring-primary/20 transition-all shadow-inner"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase ml-2 mb-1.5 block">Subject</label>
                                <select
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-primary/20 transition-all shadow-inner"
                                >
                                    <option>Science</option>
                                    <option>Mathematics</option>
                                    <option>Social Studies</option>
                                    <option>English</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase ml-2 mb-1.5 block">Grade</label>
                                <select
                                    value={grade}
                                    onChange={(e) => setGrade(e.target.value)}
                                    className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-primary/20 transition-all shadow-inner"
                                >
                                    {[6, 7, 8, 9, 10, 11, 12].map(g => <option key={g} value={g}>Class {g}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="flex gap-3 pt-4">
                            <button
                                onClick={() => handleGenerate("quiz")}
                                disabled={!topic || isGenerating !== null}
                                className="flex-1 bg-primary text-white font-black py-4 rounded-2xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                            >
                                {isGenerating === 'quiz' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                                Generate Quiz
                            </button>
                            <button
                                onClick={() => handleGenerate("lesson_plan")}
                                disabled={!topic || isGenerating !== null}
                                className="flex-1 bg-slate-900 text-white font-black py-4 rounded-2xl shadow-lg shadow-slate-900/10 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                            >
                                {isGenerating === 'lesson_plan' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Presentation className="w-4 h-4" />}
                                Lesson Plan
                            </button>
                        </div>
                    </div>
                </section>

                {/* Community Portal Card */}
                <Link href="/teacher/community" className="block mb-8">
                    <div className="bg-emerald-50 rounded-[2.5rem] p-6 border border-emerald-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:rotate-12 transition-transform">
                            <Users className="w-20 h-20 text-emerald-600" />
                        </div>
                        <div className="relative z-10 flex items-center justify-between">
                            <div>
                                <h3 className="text-base font-black text-emerald-900 mb-1">Teacher Community Exchange</h3>
                                <p className="text-xs text-emerald-600 font-bold">Browse & remix resources from other educators.</p>
                            </div>
                            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-200">
                                <Plus className="w-5 h-5" />
                            </div>
                        </div>
                    </div>
                </Link>

                {/* Assets List */}
                <section>
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                            <Library className="w-4 h-4 text-slate-400" />
                            Your Asset Library
                        </h2>
                        <span className="bg-slate-200 text-slate-600 text-[10px] font-black px-2 py-0.5 rounded-full">{assets.length}</span>
                    </div>

                    {isLoading ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="w-8 h-8 text-primary animate-spin" />
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {assets.length === 0 ? (
                                <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-slate-200">
                                    <p className="text-xs text-slate-400 font-bold">No classroom assets generated yet.</p>
                                </div>
                            ) : (
                                assets.map((asset) => (
                                    <div key={asset.id} className="bg-white rounded-[2rem] p-5 border border-slate-100 shadow-sm flex items-center justify-between group hover:border-primary/20 transition-all">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm ${asset.asset_type === 'quiz' ? 'bg-amber-50 text-amber-600' : 'bg-indigo-50 text-indigo-600'}`}>
                                                {asset.asset_type === 'quiz' ? <FileText className="w-5 h-5" /> : <BookOpen className="w-5 h-5" />}
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-black text-slate-900 group-hover:text-primary transition-colors">{asset.title}</h3>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                                                    Grade {asset.grade_level} • {asset.subject}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button className="p-2 hover:bg-slate-50 rounded-xl transition text-slate-400">
                                                <Printer className="w-4 h-4" />
                                            </button>
                                            <div className="p-2 text-slate-300">
                                                <ChevronRight className="w-4 h-4" />
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </section>
            </div>
            <BottomNav />
        </main>
    );
}
