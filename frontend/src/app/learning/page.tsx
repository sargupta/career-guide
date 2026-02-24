"use client";

import Link from "next/link";
import { ArrowLeft, BookOpen, CheckCircle, PlayCircle, Loader2, Star, ExternalLink } from "lucide-react";
import { BottomNav } from "@/components/ui/BottomNav";
import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";

interface LearningPath {
    id: string;
    title: string;
    provider: string;
    url?: string;
    category: string;
    is_free: boolean;
    language?: string;
    skills_covered?: string[];
}

interface Enrollment {
    id: string;
    path_id: string;
    progress_pct: number;
    completed_at?: string;
    learning_paths: LearningPath;
}

const demoEnrollments: Enrollment[] = [
    {
        id: "e1", path_id: "lp1", progress_pct: 65, learning_paths: {
            id: "lp1", title: "Google Data Analytics Professional Certificate", provider: "Coursera",
            url: "https://coursera.org", category: "Data Science", is_free: false,
            skills_covered: ["SQL", "Tableau", "R"], language: "English"
        }
    },
    {
        id: "e2", path_id: "lp2", progress_pct: 100, completed_at: "2025-11-20", learning_paths: {
            id: "lp2", title: "The Web Developer Bootcamp", provider: "Udemy",
            url: "https://udemy.com", category: "Software Engineering", is_free: false,
            skills_covered: ["HTML", "CSS", "Node.js"], language: "English"
        }
    }
];

const demoPaths: LearningPath[] = [
    { id: "lp3", title: "NPTEL – Data Structures & Algorithms", provider: "NPTEL", url: "https://nptel.ac.in", category: "Computer Science", is_free: true, language: "English", skills_covered: ["DSA", "C++"] },
    { id: "lp4", title: "SWAYAM – Introduction to Machine Learning", provider: "SWAYAM", url: "https://swayam.gov.in", category: "AI/ML", is_free: true, language: "Hindi/English", skills_covered: ["Python", "ML", "NumPy"] },
    { id: "lp5", title: "CS50x – Introduction to Computer Science", provider: "Harvard/edX", url: "https://cs50.harvard.edu", category: "Computer Science", is_free: true, language: "English", skills_covered: ["C", "Python", "SQL"] },
    { id: "lp6", title: "AWS Cloud Practitioner Essentials", provider: "AWS", url: "https://aws.amazon.com/training", category: "Cloud", is_free: true, language: "English", skills_covered: ["Cloud", "AWS"] },
];

const categoryColors: Record<string, string> = {
    "Data Science": "bg-violet-100 text-violet-700",
    "Software Engineering": "bg-blue-100 text-blue-700",
    "AI/ML": "bg-emerald-100 text-emerald-700",
    "Computer Science": "bg-amber-100 text-amber-700",
    "Cloud": "bg-sky-100 text-sky-700",
    "default": "bg-slate-100 text-slate-600",
};

function ProgressBar({ pct }: { pct: number }) {
    return (
        <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2">
            <div
                className="h-1.5 rounded-full bg-primary transition-all duration-500"
                style={{ width: `${pct}%` }}
            />
        </div>
    );
}

export default function LearningPage() {
    const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
    const [paths, setPaths] = useState<LearningPath[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [enrollingId, setEnrollingId] = useState<string | null>(null);

    useEffect(() => {
        async function fetchData() {
            try {
                const [enrollData, pathsData] = await Promise.all([
                    apiFetch("/learning/enrollments"),
                    apiFetch("/learning/paths"),
                ]);
                setEnrollments(enrollData.enrollments?.length > 0 ? enrollData.enrollments : demoEnrollments);
                // Filter out enrolled paths from the "discover" list
                const enrolledIds = new Set(enrollData.enrollments?.map((e: Enrollment) => e.path_id) || []);
                const all = pathsData.paths?.length > 0 ? pathsData.paths : demoPaths;
                setPaths(all.filter((p: LearningPath) => !enrolledIds.has(p.id)));
            } catch {
                setEnrollments(demoEnrollments);
                setPaths(demoPaths);
            } finally {
                setIsLoading(false);
            }
        }
        fetchData();
    }, []);

    const handleEnroll = async (pathId: string) => {
        setEnrollingId(pathId);
        try {
            await apiFetch("/learning/enroll", {
                method: "POST",
                body: JSON.stringify({ path_id: pathId }),
            });
            const path = paths.find((p) => p.id === pathId);
            if (path) {
                const newEnrollment: Enrollment = {
                    id: Date.now().toString(), path_id: pathId, progress_pct: 0, learning_paths: path
                };
                setEnrollments((prev) => [...prev, newEnrollment]);
                setPaths((prev) => prev.filter((p) => p.id !== pathId));
            }
        } catch {
            // Optimistic — handle silently
        } finally {
            setEnrollingId(null);
        }
    };

    return (
        <main className="min-h-screen bg-surface pb-24">
            <div className="fixed inset-0 bg-hero-gradient pointer-events-none" />
            <div className="max-w-2xl mx-auto px-4 relative z-10">

                {/* Header */}
                <header className="sticky top-0 z-40 glass border-b border-white/40 -mx-4 px-4 py-4 mb-6">
                    <div className="flex items-center gap-3">
                        <Link href="/dashboard" className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors text-slate-500">
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <div>
                            <h1 className="font-bold text-slate-800">Learning Paths</h1>
                            <p className="text-xs text-slate-400">Domain-matched courses & free resources</p>
                        </div>
                    </div>
                </header>

                {isLoading ? (
                    <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>
                ) : (
                    <>
                        {/* In-Progress */}
                        {enrollments.length > 0 && (
                            <section className="mb-8">
                                <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                                    <PlayCircle className="w-3.5 h-3.5" /> In Progress
                                </h2>
                                <div className="space-y-3">
                                    {enrollments.map((e) => {
                                        const p = e.learning_paths;
                                        if (!p) return null;
                                        const catColor = categoryColors[p.category] || categoryColors.default;
                                        return (
                                            <div key={e.id} className="glass p-4 rounded-2xl">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-bold text-slate-800 leading-tight">{p.title}</p>
                                                        <p className="text-xs text-slate-400 mt-0.5">{p.provider}</p>
                                                        <div className="flex flex-wrap gap-1.5 mt-2">
                                                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${catColor}`}>{p.category}</span>
                                                            {p.is_free && <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">Free</span>}
                                                        </div>
                                                        <ProgressBar pct={e.progress_pct} />
                                                        <p className="text-[10px] text-slate-400 mt-1">
                                                            {e.completed_at
                                                                ? <span className="text-emerald-600 font-semibold">✓ Completed</span>
                                                                : <span>{e.progress_pct}% complete</span>
                                                            }
                                                        </p>
                                                    </div>
                                                    {p.url && (
                                                        <a href={p.url} target="_blank" rel="noopener noreferrer"
                                                            className="text-slate-300 hover:text-primary transition-colors flex-shrink-0 mt-1">
                                                            <ExternalLink className="w-4 h-4" />
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </section>
                        )}

                        {/* Discover */}
                        <section>
                            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                                <Star className="w-3.5 h-3.5" /> Recommended for You
                            </h2>
                            <div className="space-y-3">
                                {paths.map((p) => {
                                    const catColor = categoryColors[p.category] || categoryColors.default;
                                    return (
                                        <div key={p.id} className="glass p-4 rounded-2xl">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                                                    <BookOpen className="w-5 h-5 text-primary" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-bold text-slate-800 leading-tight">{p.title}</p>
                                                    <p className="text-xs text-slate-400 mt-0.5">{p.provider}</p>
                                                    <div className="flex flex-wrap gap-1.5 mt-2">
                                                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${catColor}`}>{p.category}</span>
                                                        {p.is_free && <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">Free</span>}
                                                        {p.language && <span className="text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">{p.language}</span>}
                                                    </div>
                                                    {p.skills_covered && p.skills_covered.length > 0 && (
                                                        <p className="text-[10px] text-slate-400 mt-1.5">
                                                            Skills: {p.skills_covered.join(", ")}
                                                        </p>
                                                    )}
                                                </div>
                                                <button
                                                    onClick={() => handleEnroll(p.id)}
                                                    disabled={enrollingId === p.id}
                                                    className="flex-shrink-0 flex items-center gap-1 bg-primary text-white text-[10px] font-bold px-3 py-1.5 rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
                                                >
                                                    {enrollingId === p.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
                                                    Enroll
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                                {paths.length === 0 && (
                                    <p className="text-center py-8 text-slate-400 text-sm">You are enrolled in all recommended paths!</p>
                                )}
                            </div>
                        </section>
                    </>
                )}
            </div>
            <BottomNav />
        </main>
    );
}
