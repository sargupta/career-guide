"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Download, FileText, Loader2, RefreshCw, Star, Briefcase, GraduationCap, Layout, Linkedin } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { BottomNav } from "@/components/ui/BottomNav";

interface ResumeJSON {
    basics: {
        name: string;
        label: string;
        summary: string;
    };
    work: {
        company: string;
        position: string;
        startDate: string;
        endDate: string;
        summary: string;
        highlights: string[];
    }[];
    education: {
        institution: string;
        area: string;
        studyType: string;
    }[];
    skills: {
        name: string;
        keywords: string[];
    }[];
}

export default function ResumeBuilderPage() {
    const [resumeData, setResumeData] = useState<ResumeJSON | null>(null);
    const [loading, setLoading] = useState(true);
    const [isDownloading, setIsDownloading] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [portfolio, setPortfolio] = useState<{ share_slug: string } | null>(null);

    useEffect(() => {
        async function fetchData() {
            try {
                const [resume, port] = await Promise.all([
                    apiFetch("/resume/preview"),
                    apiFetch("/portfolio/summary").catch(() => null)
                ]);
                setResumeData(resume);
                setPortfolio(port);
            } catch (err) {
                console.error("Failed to fetch resume or portfolio data", err);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    const shareToLinkedIn = () => {
        if (!portfolio?.share_slug) {
            alert("Please enable public sharing on your Achievements page first!");
            return;
        }
        const url = `${window.location.origin}/portfolio/${portfolio.share_slug}`;
        const shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
        window.open(shareUrl, "_blank");
    };

    const handleRefresh = async () => {
        setIsRefreshing(true);
        try {
            const data = await apiFetch("/resume/preview");
            setResumeData(data);
        } catch (err) {
            console.error("Failed to refresh resume", err);
        } finally {
            setIsRefreshing(false);
        }
    };

    const handleDownload = async () => {
        setIsDownloading(true);
        try {
            const response = await apiFetch("/resume/download", { method: "GET" });
            // apiFetch might need to handle blob for download, or we use a direct link if auth allows.
            // Since apiFetch returns JSON usually, let's use a native fetch for blob.
            const url = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
            const token = localStorage.getItem("supabase-token"); // Assuming token storage

            // For MVP simplicity, we'll try a direct window.open if possible, 
            // but let's stick to a robust blob approach.
            const res = await fetch(`${url}/resume/download`, {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });
            const blob = await res.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = downloadUrl;
            a.download = `SARGVISION_Resume.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
        } catch (err) {
            console.error("Download failed", err);
        } finally {
            setIsDownloading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-surface">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-slate-50 pb-24">
            <div className="fixed inset-0 bg-hero-gradient pointer-events-none" />
            <div className="max-w-3xl mx-auto px-4 relative z-10">

                {/* Header */}
                <header className="sticky top-0 z-40 glass border-b border-white/40 -mx-4 px-4 py-4 mb-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Link href="/achievements" className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors text-slate-500">
                                <ArrowLeft className="w-5 h-5" />
                            </Link>
                            <div>
                                <h1 className="font-bold text-slate-800">AI Resume Builder</h1>
                                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Project-to-CV Bridge</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleRefresh}
                                disabled={isRefreshing}
                                className="p-2 text-slate-500 hover:text-primary hover:bg-white rounded-xl transition-all shadow-sm active:scale-95"
                                title="Refresh AI Synthesis"
                            >
                                <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
                            </button>
                            <button
                                onClick={handleDownload}
                                disabled={isDownloading}
                                className="flex items-center gap-2 bg-slate-900 text-white text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/10 active:scale-95"
                            >
                                {isDownloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                                {isDownloading ? "Generating PDF..." : "Download PDF"}
                            </button>
                        </div>
                    </div>
                </header>

                {/* Header Actions */}
                <div className="flex flex-col sm:flex-row gap-3 mb-8">
                    <button
                        onClick={handleDownload}
                        disabled={isDownloading}
                        className="flex-1 flex items-center justify-center gap-2 bg-slate-900 text-white text-xs font-bold px-4 py-3 rounded-xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10 active:scale-95"
                    >
                        {isDownloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                        {isDownloading ? "Generating PDF..." : "Download Resume PDF"}
                    </button>
                    <button
                        onClick={shareToLinkedIn}
                        className="flex-1 flex items-center justify-center gap-2 bg-white text-[#0077B5] border border-slate-200 text-xs font-bold px-4 py-3 rounded-xl hover:bg-slate-50 transition-all shadow-sm active:scale-95"
                    >
                        <Linkedin className="w-3.5 h-3.5" />
                        Share Portfolio to LinkedIn
                    </button>
                </div>

                {/* AI Insight Badge */}
                <div className="bg-primary/5 border border-primary/10 p-4 rounded-2xl mb-8 flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Star className="w-4 h-4 text-primary fill-primary" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-primary mb-1">AI Optimized Content</p>
                        <p className="text-[11px] text-slate-600 leading-relaxed">
                            Your achievements have been synthesized into recruitment-optimized 'Action-Result' bullets. This resume highlights your trajectory toward a <span className="font-bold">{resumeData?.basics.label}</span> role.
                        </p>
                    </div>
                </div>

                {/* Resume Preview Grid */}
                {resumeData ? (
                    <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 p-8 md:p-12 border border-slate-100 min-h-[800px]">
                        {/* Basics */}
                        <div className="text-center mb-10 pb-10 border-b border-slate-50">
                            <h2 className="text-3xl font-extrabold text-slate-900 mb-1 tracking-tight">{resumeData.basics.name}</h2>
                            <p className="text-lg text-primary font-medium mb-4">{resumeData.basics.label}</p>
                            <p className="text-sm text-slate-500 max-w-xl mx-auto leading-relaxed">{resumeData.basics.summary}</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
                            {/* Left Col: Exp */}
                            <div className="md:col-span-8 space-y-10">
                                <section>
                                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                                        <Briefcase className="w-4 h-4" />
                                        Experience & Projects
                                    </h3>
                                    <div className="space-y-8">
                                        {resumeData.work.map((w, i) => (
                                            <div key={i} className="group relative pl-6 border-l-2 border-slate-100 hover:border-primary transition-colors">
                                                <div className="absolute w-2.5 h-2.5 bg-slate-200 group-hover:bg-primary rounded-full -left-[6px] top-1.5 transition-colors" />
                                                <div className="flex justify-between items-baseline mb-1">
                                                    <h4 className="font-bold text-slate-800">{w.company}</h4>
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{w.startDate} - {w.endDate || 'Present'}</span>
                                                </div>
                                                <p className="text-xs font-bold text-primary mb-3">{w.position}</p>
                                                <p className="text-xs text-slate-500 mb-4 leading-relaxed">{w.summary}</p>
                                                <ul className="space-y-2">
                                                    {w.highlights.map((h, j) => (
                                                        <li key={j} className="text-xs text-slate-600 flex gap-2">
                                                            <span className="text-primary mt-1">•</span>
                                                            {h}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            </div>

                            {/* Right Col: Skills & Edu */}
                            <div className="md:col-span-4 space-y-10">
                                <section>
                                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                                        <Layout className="w-4 h-4" />
                                        Skills
                                    </h3>
                                    <div className="space-y-5">
                                        {resumeData.skills.map((s, i) => (
                                            <div key={i} className="space-y-2">
                                                <p className="text-[10px] font-black text-slate-900 uppercase tracking-wider">{s.name}</p>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {s.keywords.map((k, j) => (
                                                        <span key={j} className="text-[10px] font-bold text-slate-600 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">
                                                            {k}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>

                                <section>
                                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                                        <GraduationCap className="w-4 h-4" />
                                        Education
                                    </h3>
                                    <div className="space-y-6">
                                        {resumeData.education.map((e, i) => (
                                            <div key={i} className="space-y-1">
                                                <p className="text-xs font-bold text-slate-800 leading-snug">{e.institution}</p>
                                                <p className="text-[11px] text-slate-500 font-medium">{e.studyType}, {e.area}</p>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-20 glass rounded-3xl">
                        <FileText className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                        <p className="text-slate-400 text-sm">No resume data found. Log your first achievement!</p>
                    </div>
                )}
            </div>

            <BottomNav />
        </main>
    );
}
