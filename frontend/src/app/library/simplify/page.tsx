"use client";

import { useState, useRef } from "react";
import { apiFetch } from "@/lib/api";
import { BottomNav } from "@/components/ui/BottomNav";
import {
    Sparkles, ArrowLeft, Send, Sparkle,
    Languages, BookOpen, Lightbulb, Loader2,
    Camera, FileUp, X
} from "lucide-react";
import Link from "next/link";

export default function SimplifyPage() {
    const [text, setText] = useState("");
    const [level, setLevel] = useState("basic");
    const [language, setLanguage] = useState("English");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<string | null>(null);
    const [notes, setNotes] = useState<string | null>(null);
    const [roadmap, setRoadmap] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const notesInputRef = useRef<HTMLInputElement>(null);
    const roadmapInputRef = useRef<HTMLInputElement>(null);

    const handleSimplify = async () => {
        if (!text.trim()) return;
        setLoading(true);
        setResult(null);
        setNotes(null);
        setRoadmap(null);
        setRoadmap(null);
        try {
            const data = await apiFetch("/simplify/text", {
                method: "POST",
                body: JSON.stringify({ text, level, language }),
            });
            setResult(data.simplified);
        } catch (err) {
            console.error("Simplification failed", err);
            setResult("Sorry, I couldn't simplify that text. Please check your connection and try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleNotes = async () => {
        if (!text.trim()) return;
        setLoading(true);
        setResult(null);
        setNotes(null);
        setRoadmap(null);
        setRoadmap(null);
        try {
            const data = await apiFetch("/simplify/notes", {
                method: "POST",
                body: JSON.stringify({ text, level, language }),
            });
            setNotes(data.notes);
        } catch (err) {
            console.error("Notes extraction failed", err);
            setNotes("Sorry, I couldn't generate notes for that text.");
        } finally {
            setLoading(false);
        }
    };

    const handleRoadmap = async () => {
        if (!text.trim()) return;
        setLoading(true);
        setResult(null);
        setNotes(null);
        setRoadmap(null);
        setRoadmap(null);
        try {
            const data = await apiFetch("/simplify/roadmap", {
                method: "POST",
                body: JSON.stringify({ text, level, language }),
            });
            setRoadmap(data.roadmap);
        } catch (err) {
            console.error("Roadmap generation failed", err);
            setRoadmap("Sorry, I couldn't generate a roadmap for that topic.");
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'simplify' | 'notes' | 'roadmap') => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        setResult(null);
        setNotes(null);
        setRoadmap(null);
        const formData = new FormData();
        formData.append("file", file);

        try {
            const token = localStorage.getItem("token");
            let endpoint = '';
            if (type === 'simplify') endpoint = '/simplify/upload';
            else if (type === 'notes') endpoint = '/simplify/notes/upload';
            else endpoint = '/simplify/roadmap/upload';

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}${endpoint}?level=${level}&language=${language}`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`
                },
                body: formData
            });

            if (!response.ok) throw new Error("Upload failed");

            const data = await response.json();
            if (type === 'simplify') setResult(data.simplified);
            else if (type === 'notes') setNotes(data.notes);
            else setRoadmap(data.roadmap);
        } catch (err) {
            console.error("Operation failed", err);
            setResult("Could not process the document. Make sure it's a clear image or PDF.");
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
            if (notesInputRef.current) notesInputRef.current.value = "";
            if (roadmapInputRef.current) roadmapInputRef.current.value = "";
        }
    };

    const saveToPortfolio = async (content: string, type: 'simplification' | 'note' | 'roadmap') => {
        try {
            await apiFetch("/activities", {
                method: "POST",
                body: JSON.stringify({
                    type: "achievement",
                    title: `Saved ${type}: ${text.slice(0, 30)}...`,
                    detail: content.slice(0, 200),
                    academic_year: 2,
                }),
            });
            alert("Saved to your achievement portfolio! (+10 XP)");
        } catch (err) {
            console.error("Failed to save", err);
        }
    };

    return (
        <div className="min-h-screen bg-surface pb-24">
            <header className="sticky top-0 z-40 glass border-b border-white/40 px-4 py-4">
                <div className="max-w-2xl mx-auto flex items-center gap-4">
                    <Link href="/library" className="p-2 hover:bg-white/50 rounded-full transition-colors">
                        <ArrowLeft className="w-5 h-5 text-slate-600" />
                    </Link>
                    <div>
                        <h1 className="font-bold text-slate-800 text-lg">Concept Simplifier</h1>
                        <p className="text-xs text-slate-400">Transform jargon into intuition, notes & roadmaps</p>
                    </div>
                </div>
            </header>

            <main className="max-w-2xl mx-auto px-4 py-8 space-y-8">
                <section className="space-y-4">
                    <div className="glass p-4 space-y-4">
                        <div className="relative">
                            <textarea
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                                placeholder="Paste your complex textbook paragraph, research abstract, or technical jargon here..."
                                className="w-full h-48 bg-white/30 border border-white/60 rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium placeholder:text-slate-400"
                            />
                            {text && (
                                <button
                                    onClick={() => setText("")}
                                    className="absolute top-2 right-2 p-1 bg-white/50 rounded-full hover:bg-white transition-colors"
                                >
                                    <X className="w-4 h-4 text-slate-400" />
                                </button>
                            )}
                        </div>

                        <div className="flex flex-wrap gap-4 items-center justify-between">
                            <div className="flex gap-2">
                                <select
                                    value={level}
                                    onChange={(e) => setLevel(e.target.value)}
                                    className="bg-white/50 border border-slate-100 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-600 focus:outline-none"
                                >
                                    <option value="basic">ELIF (Level 1)</option>
                                    <option value="intermediate">Academic (Level 2)</option>
                                    <option value="advanced">Deep Dive (Level 3)</option>
                                </select>

                                <button
                                    onClick={() => setLanguage(language === "English" ? "Hinglish" : "English")}
                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${language === "Hinglish"
                                        ? "bg-accent/10 border-accent text-accent"
                                        : "bg-white border-slate-100 text-slate-400"
                                        }`}
                                >
                                    <Languages className="w-3.5 h-3.5" />
                                    {language}
                                </button>
                            </div>

                            <div className="flex gap-2">
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={(e) => handleFileUpload(e, 'simplify')}
                                    className="hidden"
                                    accept="image/*,application/pdf"
                                />
                                <input
                                    type="file"
                                    ref={notesInputRef}
                                    onChange={(e) => handleFileUpload(e, 'notes')}
                                    className="hidden"
                                    accept="image/*,application/pdf"
                                />
                                <input
                                    type="file"
                                    ref={roadmapInputRef}
                                    onChange={(e) => handleFileUpload(e, 'roadmap')}
                                    className="hidden"
                                    accept="image/*,application/pdf"
                                />
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={uploading || loading}
                                    title="Scan Textbook for Analysis"
                                    className="p-2.5 bg-white border border-slate-100 rounded-xl hover:bg-slate-50 transition-all disabled:opacity-50"
                                >
                                    <Camera className="w-4 h-4 text-slate-600" />
                                </button>

                                <button
                                    onClick={handleSimplify}
                                    disabled={loading || uploading || !text.trim()}
                                    className="bg-primary text-white px-3 py-2 rounded-xl font-bold text-[10px] uppercase tracking-wider shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all flex items-center gap-2 disabled:opacity-50"
                                >
                                    {loading && !notes && !roadmap ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                                    Simplify
                                </button>

                                <button
                                    onClick={handleNotes}
                                    disabled={loading || uploading || !text.trim()}
                                    className="bg-slate-800 text-white px-3 py-2 rounded-xl font-bold text-[10px] uppercase tracking-wider shadow-lg shadow-slate-800/20 hover:scale-[1.02] transition-all flex items-center gap-2 disabled:opacity-50"
                                >
                                    {loading && notes && !roadmap ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileUp className="w-3.5 h-3.5" />}
                                    Notes
                                </button>

                                <button
                                    onClick={handleRoadmap}
                                    disabled={loading || uploading || !text.trim()}
                                    className="bg-teal-600 text-white px-3 py-2 rounded-xl font-bold text-[10px] uppercase tracking-wider shadow-lg shadow-teal-600/20 hover:scale-[1.02] transition-all flex items-center gap-2 disabled:opacity-50"
                                >
                                    {loading && roadmap ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                                    Path
                                </button>
                            </div>
                        </div>
                    </div>
                </section>

                {uploading && (
                    <div className="glass p-12 text-center animate-pulse">
                        <Loader2 className="w-12 h-12 mx-auto mb-4 text-primary animate-spin" />
                        <p className="font-bold text-slate-800">Processing document...</p>
                        <p className="text-xs text-slate-400 mt-2">Gemini is extracting text and generating insights</p>
                    </div>
                )}

                {/* Result Section (Simplification) */}
                {result && (
                    <section className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Sparkle className="w-4 h-4 text-primary" />
                                <h2 className="font-black text-slate-800 text-sm uppercase tracking-wider">Simplified Insight</h2>
                            </div>
                            <button
                                onClick={() => saveToPortfolio(result, 'simplification')}
                                className="text-[10px] font-bold text-primary uppercase tracking-widest hover:underline"
                            >
                                Save to Portfolio
                            </button>
                        </div>

                        <div className="glass p-6 prose prose-slate max-w-none">
                            <div className="whitespace-pre-wrap text-sm text-slate-700 leading-relaxed font-medium">
                                {result}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="glass-sm p-4 flex gap-3 items-start">
                                <div className="p-2 bg-blue-50 text-blue-500 rounded-lg">
                                    <Lightbulb className="w-4 h-4" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-800 text-xs">Got it?</h4>
                                    <p className="text-[10px] text-slate-400">Save this to your library</p>
                                </div>
                            </div>
                            <div className="glass-sm p-4 flex gap-3 items-start">
                                <div className="p-2 bg-primary/10 text-primary rounded-lg">
                                    <BookOpen className="w-4 h-4" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-800 text-xs">More?</h4>
                                    <p className="text-[10px] text-slate-400">Find related resources</p>
                                </div>
                            </div>
                        </div>
                    </section>
                )}

                {/* Roadmap Section */}
                {roadmap && (
                    <section className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Send className="w-4 h-4 text-teal-600" />
                                <h2 className="font-black text-slate-800 text-sm uppercase tracking-wider">Career Roadmap</h2>
                            </div>
                            <button
                                onClick={() => saveToPortfolio(roadmap, 'roadmap')}
                                className="text-[10px] font-bold text-teal-600 uppercase tracking-widest hover:underline"
                            >
                                Save to Portfolio
                            </button>
                        </div>

                        <div className="bg-teal-50/50 backdrop-blur-md border border-teal-100 rounded-3xl p-8 shadow-xl">
                            <div className="whitespace-pre-wrap text-sm text-slate-700 leading-relaxed font-medium markdown-content">
                                {roadmap}
                            </div>

                            {/* Visual Hint */}
                            <div className="mt-8 pt-6 border-t border-teal-100/50 flex items-center justify-center gap-8">
                                <div className="flex flex-col items-center gap-1 opacity-40">
                                    <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center">
                                        <BookOpen className="w-4 h-4 text-teal-600" />
                                    </div>
                                    <span className="text-[8px] font-bold uppercase tracking-tighter">Learn</span>
                                </div>
                                <div className="h-px w-8 bg-teal-200" />
                                <div className="flex flex-col items-center gap-1">
                                    <div className="w-10 h-10 rounded-full bg-teal-600 flex items-center justify-center shadow-lg shadow-teal-200">
                                        <Sparkles className="w-5 h-5 text-white" />
                                    </div>
                                    <span className="text-[8px] font-bold text-teal-600 uppercase tracking-tighter">Skill Up</span>
                                </div>
                                <div className="h-px w-8 bg-teal-200" />
                                <div className="flex flex-col items-center gap-1 opacity-40">
                                    <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center">
                                        <Lightbulb className="w-4 h-4 text-teal-600" />
                                    </div>
                                    <span className="text-[8px] font-bold uppercase tracking-tighter">Role</span>
                                </div>
                            </div>
                        </div>
                    </section>
                )}

                {!result && !notes && !roadmap && !uploading && (
                    <div className="grid grid-cols-2 gap-4">
                        <div className="glass-sm p-4 flex gap-3 items-start opacity-60">
                            <div className="p-2 bg-blue-50 text-blue-500 rounded-lg">
                                <Lightbulb className="w-4 h-4" />
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-800 text-xs">Simplify</h4>
                                <p className="text-[10px] text-slate-400">Get intuitive analogies</p>
                            </div>
                        </div>
                        <div className="glass-sm p-4 flex gap-3 items-start opacity-60">
                            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                                <Send className="w-4 h-4" />
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-800 text-xs">Roadmap</h4>
                                <p className="text-[10px] text-slate-400">See career trajectories</p>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            <BottomNav />
        </div>
    );
}
