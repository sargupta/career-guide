"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { BottomNav } from "@/components/ui/BottomNav";
import {
    Search, Filter, BookOpen, Video, FileText,
    GraduationCap, ExternalLink, Sparkles, Loader2
} from "lucide-react";

interface Resource {
    id: string;
    title: string;
    description: string;
    url: string;
    type: "video" | "pdf" | "article" | "course";
    tags: string[];
    difficulty: "beginner" | "intermediate" | "advanced";
}

export default function LibraryPage() {
    const [resources, setResources] = useState<Resource[]>([]);
    const [suggested, setSuggested] = useState<Resource[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterType, setFilterType] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadData() {
            try {
                const [resData, suggestData] = await Promise.all([
                    apiFetch("/library/resources"),
                    apiFetch("/library/suggest")
                ]);
                setResources(resData.resources || []);
                setSuggested(suggestData.suggested || []);
            } catch (err) {
                console.error("Failed to load library data", err);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, []);

    const filteredResources = resources.filter(r => {
        const matchesSearch = r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            r.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesType = !filterType || r.type === filterType;
        return matchesSearch && matchesType;
    });

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-surface">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-surface pb-24">
            {/* Header */}
            <header className="sticky top-0 z-40 glass border-b border-white/40 px-4 py-4">
                <div className="max-w-2xl mx-auto space-y-4">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="font-bold text-slate-800 text-lg">Resource Library</h1>
                            <p className="text-xs text-slate-400">Curated materials for your career path</p>
                        </div>
                        <div className="p-2 glass-sm rounded-full">
                            <BookOpen className="w-5 h-5 text-primary" />
                        </div>
                    </div>

                    {/* Search Bar */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search topics, skills, or subjects..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-white/50 border border-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                        />
                    </div>
                </div>
            </header>

            <main className="max-w-2xl mx-auto px-4 py-6 space-y-8">
                {/* AI Suggestions Section */}
                {!searchQuery && suggested.length > 0 && (
                    <section className="space-y-4">
                        <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-accent" />
                            <h2 className="font-black text-slate-800 text-sm uppercase tracking-wider">Suggested for You</h2>
                        </div>
                        <div className="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1">
                            {suggested.map((r) => (
                                <ResourceCard key={r.id} resource={r} compact />
                            ))}
                        </div>
                    </section>
                )}

                {/* Main Library Section */}
                <section className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h2 className="font-black text-slate-800 text-sm uppercase tracking-wider">Full Library</h2>

                        {/* Type Filters */}
                        <div className="flex gap-2">
                            {["video", "pdf", "article"].map((t) => (
                                <button
                                    key={t}
                                    onClick={() => setFilterType(filterType === t ? null : t)}
                                    className={`p-1.5 rounded-lg border transition-all ${filterType === t
                                            ? "bg-primary/10 border-primary text-primary"
                                            : "bg-white border-slate-100 text-slate-400"
                                        }`}
                                >
                                    {t === "video" && <Video className="w-3.5 h-3.5" />}
                                    {t === "pdf" && <FileText className="w-3.5 h-3.5" />}
                                    {t === "article" && <FileText className="w-3.5 h-3.5" />}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid gap-4">
                        {filteredResources.length > 0 ? (
                            filteredResources.map((r) => (
                                <ResourceCard key={r.id} resource={r} />
                            ))
                        ) : (
                            <div className="glass p-12 text-center text-slate-400">
                                <Search className="w-12 h-12 mx-auto mb-4 opacity-20" />
                                <p className="text-sm">No resources found matching your search.</p>
                            </div>
                        )}
                    </div>
                </section>
            </main>

            <BottomNav />
        </div>
    );
}

function ResourceCard({ resource, compact = false }: { resource: Resource, compact?: boolean }) {
    return (
        <a
            href={resource.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`glass-sm group flex flex-col transition-all hover:border-primary/40 hover:shadow-lg ${compact ? "w-64 flex-shrink-0" : "w-full"
                }`}
        >
            <div className="p-4 space-y-3">
                <div className="flex justify-between items-start">
                    <div className={`p-2 rounded-lg ${resource.type === 'video' ? 'bg-red-50 text-red-500' :
                            resource.type === 'pdf' ? 'bg-orange-50 text-orange-500' :
                                'bg-blue-50 text-blue-500'
                        }`}>
                        {resource.type === 'video' ? <Video className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${resource.difficulty === 'beginner' ? 'bg-green-100 text-green-600' :
                            resource.difficulty === 'intermediate' ? 'bg-blue-100 text-blue-600' :
                                'bg-purple-100 text-purple-600'
                        }`}>
                        {resource.difficulty}
                    </span>
                </div>

                <div>
                    <h3 className="font-bold text-slate-800 group-hover:text-primary transition-colors line-clamp-1">
                        {resource.title}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                        {resource.description}
                    </p>
                </div>

                <div className="flex flex-wrap gap-1 pt-1">
                    {resource.tags.slice(0, 3).map((tag, i) => (
                        <span key={i} className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md">
                            {tag}
                        </span>
                    ))}
                </div>

                <div className="pt-2 flex items-center justify-between text-[10px] font-bold text-primary uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                    <span>View Resource</span>
                    <ExternalLink className="w-3 h-3" />
                </div>
            </div>
        </a>
    );
}
