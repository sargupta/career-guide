"use client";

import Link from "next/link";
import { ArrowLeft, Plus, Trophy, Briefcase, BookOpen, FileText, Star, X, Loader2, Trash2, ExternalLink, Linkedin, Share2 } from "lucide-react";
import { BottomNav } from "@/components/ui/BottomNav";
import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";

type AchievementType = "project" | "competition" | "course" | "other";
const achievementTypes: AchievementType[] = ["project", "competition", "course", "other"];

interface Achievement {
    id: string;
    title: string;
    description: string;
    type: AchievementType;
    academic_year: string;
    semester?: string;
    links_json?: string[];
    visibility: string;
}

interface PortfolioMetadata {
    is_public: boolean;
    share_slug: string | null;
    updated_at: string | null;
    theme?: string;
}

const typeConfig: Record<AchievementType | string, { icon: React.ReactNode; color: string; label: string }> = {
    project: { icon: <FileText className="w-4 h-4" />, color: "bg-blue-100 text-blue-700", label: "Project" },
    competition: { icon: <Trophy className="w-4 h-4" />, color: "bg-amber-100 text-amber-700", label: "Competition" },
    course: { icon: <BookOpen className="w-4 h-4" />, color: "bg-emerald-100 text-emerald-700", label: "Course" },
    other: { icon: <Star className="w-4 h-4" />, color: "bg-slate-100 text-slate-700", label: "Other" },
};

const demoAchievements: Achievement[] = [
    { id: "1", title: "IEEE SRM Hackathon — 2nd Place", description: "Led a 4-person team building an AI-powered resume analyzer. Awarded ₹25,000 prize.", type: "competition", academic_year: "Year 2", semester: "Sem 1", links_json: [], visibility: "public" },
    { id: "2", title: "Full-Stack E-Commerce Project", description: "Developed a React/Node.js app with Stripe integration and state management.", type: "project", academic_year: "Year 2", semester: "Sem 2", links_json: ["#"], visibility: "public" },
];

export default function AchievementsPage() {
    const [achievements, setAchievements] = useState<Achievement[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [portfolio, setPortfolio] = useState<PortfolioMetadata | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [saving, setSaving] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const [form, setForm] = useState({
        type: "project" as AchievementType,
        title: "",
        description: "",
        academic_year: "Year 1",
        semester: "Sem 1",
        link: "",
        visibility: "private" as "public" | "private",
    });

    useEffect(() => {
        async function fetchData() {
            try {
                const [achData, portData] = await Promise.all([
                    apiFetch("/achievements"),
                    apiFetch("/portfolio/summary").catch(() => null)
                ]);
                setAchievements(achData.achievements?.length > 0 ? achData.achievements : demoAchievements);
                setPortfolio(portData);
            } catch {
                setAchievements(demoAchievements);
            } finally {
                setIsLoading(false);
            }
        }
        fetchData();
    }, []);

    const handleGeneratePortfolio = async () => {
        setIsGenerating(true);
        try {
            const data = await apiFetch("/portfolio/synthesize", { method: "POST" });
            setPortfolio(data);
            alert("✨ AI Portfolio synthesized! Your professional narrative is ready.");
        } catch (err: any) {
            alert("Failed to generate portfolio: " + err.message);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleTogglePublic = async (val: boolean) => {
        try {
            const data = await apiFetch("/portfolio/toggle-public", {
                method: "POST",
                body: JSON.stringify(val),
            });
            setPortfolio(prev => prev ? { ...prev, is_public: val, share_slug: data.share_slug } : null);
        } catch (err: any) {
            alert("Failed to update visibility: " + err.message);
        }
    };

    const handleThemeChange = async (theme: string) => {
        try {
            await apiFetch("/portfolio/theme", {
                method: "POST",
                body: JSON.stringify(theme),
            });
            setPortfolio(prev => prev ? { ...prev, theme } : null);
        } catch (err: any) {
            alert("Failed to update theme: " + err.message);
        }
    };

    const handleShareAchievement = (a: Achievement) => {
        const url = portfolio?.share_slug
            ? `${window.location.origin}/portfolio/${portfolio.share_slug}`
            : window.location.origin;
        const text = `I'm thrilled to share my latest achievement on SARGVISION AI: ${a.title}! 🚀\n\n${a.description}\n\nCheck out my full portfolio here: ${url}`;
        const shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
        window.open(shareUrl, "_blank");
    };

    const handleCreate = async () => {
        if (!form.title.trim()) return;
        setSaving(true);
        try {
            const data = await apiFetch("/achievements", {
                method: "POST",
                body: JSON.stringify({
                    title: form.title,
                    description: form.description,
                    type: form.type,
                    academic_year: form.academic_year,
                    semester: form.semester,
                    links_json: form.link ? [form.link] : [],
                    visibility: form.visibility,
                }),
            });
            setAchievements((prev) => [data.achievement, ...prev]);
        } catch {
            const optimistic: Achievement = {
                id: Date.now().toString(), title: form.title, description: form.description,
                type: form.type, academic_year: form.academic_year, semester: form.semester,
                links_json: form.link ? [form.link] : [], visibility: form.visibility,
            };
            setAchievements((prev) => [optimistic, ...prev]);
        } finally {
            setSaving(false);
            setShowModal(false);
            setForm({ type: "project", title: "", description: "", academic_year: "Year 1", semester: "Sem 1", link: "", visibility: "private" });
        }
    };

    const handleDelete = async (id: string) => {
        setDeletingId(id);
        try {
            await apiFetch(`/achievements/${id}`, { method: "DELETE" });
        } catch { /* silent */ } finally {
            setAchievements((prev) => prev.filter((a) => a.id !== id));
            setDeletingId(null);
        }
    };

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
                                <h1 className="font-bold text-slate-800">Achievements Portfolio</h1>
                                <p className="text-xs text-slate-400">{achievements.length} items in your portfolio</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Link
                                href="/resume"
                                className="flex items-center gap-1.5 bg-slate-900 text-white text-xs font-semibold px-3 py-2 rounded-xl hover:bg-slate-800 transition-colors"
                            >
                                <FileText className="w-3.5 h-3.5" />
                                Resume
                            </Link>
                            <button
                                onClick={() => setShowModal(true)}
                                className="flex items-center gap-1.5 bg-primary text-white text-xs font-semibold px-3 py-2 rounded-xl hover:bg-primary/90 transition-colors"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                Add
                            </button>
                        </div>
                    </div>
                </header>

                {/* AI Portfolio Banner */}
                <div className="glass rounded-3xl p-6 mb-8 border-l-4 border-primary relative overflow-hidden group">
                    <div className="absolute right-0 top-0 w-24 h-24 bg-primary/10 blur-2xl rounded-full -mr-12 -mt-12 group-hover:bg-primary/20 transition-colors" />
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-2">
                            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                <Star className="w-4 h-4 text-primary fill-primary" />
                                Smart AI Portfolio
                            </h2>
                            {portfolio?.updated_at && (
                                <span className="text-[10px] text-slate-400 font-medium">
                                    Last updated: {new Date(portfolio.updated_at).toLocaleDateString()}
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed mb-6">
                            Transform your raw achievements into a professional career narrative optimized for recruiters.
                        </p>

                        <div className="flex flex-col gap-4">
                            <button
                                onClick={handleGeneratePortfolio}
                                disabled={isGenerating}
                                className="w-full bg-slate-900 text-white text-xs font-bold py-3 rounded-xl hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
                            >
                                {isGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "✨"}
                                {isGenerating ? "Synthesizing Narrative..." : portfolio?.updated_at ? "Refresh AI Narrative" : "Generate Professional Portfolio"}
                            </button>

                            {portfolio?.share_slug && (
                                <div className="space-y-3 pt-4 border-t border-slate-100">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                id="public-toggle"
                                                checked={portfolio.is_public}
                                                onChange={(e) => handleTogglePublic(e.target.checked)}
                                                className="rounded border-slate-300 text-primary w-4 h-4"
                                            />
                                            <label htmlFor="public-toggle" className="text-xs font-bold text-slate-700">Enable Public Share Link</label>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase">Theme:</span>
                                            <select
                                                value={portfolio.theme || "modern"}
                                                onChange={(e) => handleThemeChange(e.target.value)}
                                                className="bg-white border border-slate-200 text-[10px] font-bold py-1 px-2 rounded-lg text-slate-700 focus:outline-none focus:border-primary"
                                            >
                                                <option value="modern">Modern</option>
                                                <option value="royal">Royal</option>
                                                <option value="minimal">Minimal</option>
                                            </select>
                                        </div>
                                        {portfolio.is_public && (
                                            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">Live</span>
                                        )}
                                    </div>

                                    {portfolio.is_public && (
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 bg-white/50 border border-slate-200 px-3 py-2 rounded-lg text-[10px] font-mono text-slate-500 truncate">
                                                {window.location.origin}/portfolio/{portfolio.share_slug}
                                            </div>
                                            <button
                                                onClick={() => {
                                                    navigator.clipboard.writeText(`${window.location.origin}/portfolio/${portfolio.share_slug}`);
                                                    alert("Link copied!");
                                                }}
                                                className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-primary"
                                                title="Copy Link"
                                            >
                                                <Star className="w-4 h-4" />
                                            </button>
                                            <Link
                                                href={`/portfolio/${portfolio.share_slug}`}
                                                target="_blank"
                                                className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-primary"
                                                title="View Portfolio"
                                            >
                                                <ExternalLink className="w-4 h-4" />
                                            </Link>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Cards */}
                {isLoading ? (
                    <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>
                ) : (
                    <div className="space-y-4">
                        {achievements.map((a) => {
                            const config = typeConfig[a.type] || typeConfig.other;
                            return (
                                <div key={a.id} className="glass rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
                                    {/* Accent Bar */}
                                    <div className="h-1 w-full bg-gradient-to-r from-primary to-emerald-400" />
                                    <div className="p-5">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1.5">
                                                    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${config.color}`}>
                                                        {config.icon}
                                                        {config.label}
                                                    </span>
                                                    {a.visibility === "public" && (
                                                        <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                                                            Public
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-base font-bold text-slate-800 leading-tight">{a.title}</p>
                                                {a.description && (
                                                    <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{a.description}</p>
                                                )}
                                                <div className="flex items-center gap-3 mt-3">
                                                    <span className="text-[10px] text-slate-400">
                                                        {a.semester ? `${a.semester}, ` : ""}{a.academic_year}
                                                    </span>
                                                    {a.links_json && a.links_json.length > 0 && (
                                                        <a href={a.links_json[0]} target="_blank" rel="noopener noreferrer"
                                                            className="text-[10px] text-primary font-semibold hover:underline">
                                                            View Project →
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() => handleShareAchievement(a)}
                                                    className="p-2 hover:bg-slate-50 rounded-lg transition-colors text-slate-400 hover:text-[#0077B5]"
                                                    title="Share to LinkedIn"
                                                >
                                                    <Linkedin className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(a.id)}
                                                    disabled={deletingId === a.id}
                                                    className="p-1.5 text-slate-300 hover:text-red-400 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                                                >
                                                    {deletingId === a.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        {achievements.length === 0 && (
                            <div className="text-center py-16">
                                <Trophy className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                                <p className="text-slate-400 text-sm">No achievements yet. Add your first one!</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Add Achievement Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)} />
                    <div className="relative w-full max-w-md glass rounded-3xl p-6 space-y-4 shadow-2xl">
                        <div className="flex items-center justify-between">
                            <h2 className="font-bold text-slate-800">Add to Portfolio</h2>
                            <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors text-slate-400">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="space-y-3">
                            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as AchievementType })}
                                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white/80 text-sm focus:outline-none focus:border-primary text-slate-700">
                                {achievementTypes.map((t) => (
                                    <option key={t} value={t}>{typeConfig[t].label}</option>
                                ))}
                            </select>
                            <input placeholder="Title *" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white/80 text-sm focus:outline-none focus:border-primary placeholder:text-slate-400" />
                            <textarea placeholder="Brief description (optional)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                                rows={2}
                                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white/80 text-sm focus:outline-none focus:border-primary placeholder:text-slate-400 resize-none" />
                            <input placeholder="Link (GitHub, Drive, etc.)" value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })}
                                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white/80 text-sm focus:outline-none focus:border-primary placeholder:text-slate-400" />
                            <div className="grid grid-cols-2 gap-2">
                                <select value={form.academic_year} onChange={(e) => setForm({ ...form, academic_year: e.target.value })}
                                    className="px-3 py-2.5 rounded-xl border border-slate-200 bg-white/80 text-sm focus:outline-none focus:border-primary text-slate-700">
                                    {["Year 1", "Year 2", "Year 3", "Year 4"].map((y) => <option key={y}>{y}</option>)}
                                </select>
                                <select value={form.semester} onChange={(e) => setForm({ ...form, semester: e.target.value })}
                                    className="px-3 py-2.5 rounded-xl border border-slate-200 bg-white/80 text-sm focus:outline-none focus:border-primary text-slate-700">
                                    {["Sem 1", "Sem 2", "Summer"].map((s) => <option key={s}>{s}</option>)}
                                </select>
                            </div>
                            <div className="flex items-center gap-2">
                                <input type="checkbox" id="pub" checked={form.visibility === "public"} onChange={(e) => setForm({ ...form, visibility: e.target.checked ? "public" : "private" })}
                                    className="rounded border-slate-300 text-primary" />
                                <label htmlFor="pub" className="text-xs text-slate-600">Make this public on my portfolio</label>
                            </div>
                        </div>
                        <button onClick={handleCreate} disabled={saving || !form.title.trim()}
                            className="w-full bg-primary text-white font-semibold py-3 rounded-xl hover:bg-primary/90 disabled:bg-slate-200 disabled:text-slate-400 transition-colors flex items-center justify-center gap-2">
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                            {saving ? "Adding..." : "Add to Portfolio"}
                        </button>
                    </div>
                </div>
            )}

            <BottomNav />
        </main>
    );
}
