"use client";

import Link from "next/link";
import { ArrowLeft, BookOpen, Copy, Download, FileText, Filter, Heart, Loader2, Search, Share2, Sparkles, User, Wand2 } from "lucide-react";
import { BottomNav } from "@/components/ui/BottomNav";
import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";

export default function TeacherCommunity() {
    const [assets, setAssets] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRemixing, setIsRemixing] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedSubject, setSelectedSubject] = useState<string>("All");

    useEffect(() => {
        fetchCommunity();
    }, []);

    const fetchCommunity = async () => {
        try {
            const res = await apiFetch("/teacher/community");
            setAssets(res.assets || []);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRemix = async (assetId: string) => {
        setIsRemixing(assetId);
        try {
            await apiFetch(`/teacher/assets/${assetId}/remix`, { method: "POST" });
            // Show success or redirect
            alert("Asset remixed to your library!");
        } catch (e) {
            console.error(e);
        } finally {
            setIsRemixing(null);
        }
    };

    const filteredAssets = assets.filter(a => {
        const matchesSearch = a.title.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesSubject = selectedSubject === "All" || a.subject === selectedSubject;
        return matchesSearch && matchesSubject;
    });

    return (
        <main className="min-h-screen bg-slate-50 pb-24">
            <div className="max-w-2xl mx-auto px-4 py-8">
                {/* Header */}
                <header className="mb-8">
                    <div className="flex items-center gap-4 mb-6">
                        <Link href="/teacher/dashboard" className="p-2 hover:bg-white rounded-xl transition-colors text-slate-500 shadow-sm">
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-black text-slate-900 leading-none mb-1">Community Exchange</h1>
                            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Collaborative Pedagogy</p>
                        </div>
                    </div>

                    {/* Search & Filter */}
                    <div className="flex gap-3">
                        <div className="flex-1 relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search resources..."
                                className="w-full bg-white border border-slate-200 rounded-2xl pl-11 pr-4 py-3.5 text-sm font-bold text-slate-900 placeholder:text-slate-300 focus:ring-2 focus:ring-primary/20 transition-all shadow-sm"
                            />
                        </div>
                        <button className="bg-white border border-slate-200 p-3.5 rounded-2xl shadow-sm text-slate-400">
                            <Filter className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="flex gap-2 mt-4 overflow-x-auto pb-2 scrollbar-hide">
                        {["All", "Science", "Mathematics", "Social Studies", "English"].map(s => (
                            <button
                                key={s}
                                onClick={() => setSelectedSubject(s)}
                                className={`whitespace-nowrap px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all ${selectedSubject === s ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-400 border-slate-100 hover:border-slate-200'}`}
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                </header>

                {isLoading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="w-8 h-8 text-primary animate-spin" />
                    </div>
                ) : (
                    <div className="space-y-6">
                        {filteredAssets.length === 0 ? (
                            <div className="text-center py-20 bg-white rounded-[2.5rem] border border-dashed border-slate-200">
                                <Sparkles className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                                <p className="text-sm text-slate-400 font-bold">No public resources found in this category.</p>
                            </div>
                        ) : (
                            filteredAssets.map((asset) => (
                                <div key={asset.id} className="bg-white rounded-[2.5rem] p-6 border border-slate-100 shadow-sm relative overflow-hidden group">
                                    <div className="flex items-start justify-between gap-4 relative z-10">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg uppercase tracking-wider ${asset.asset_type === 'quiz' ? 'bg-amber-50 text-amber-600' : 'bg-indigo-50 text-indigo-600'}`}>
                                                    {asset.asset_type === 'quiz' ? 'Quiz' : 'Lesson Plan'}
                                                </span>
                                                <span className="text-[9px] font-black bg-slate-50 text-slate-400 px-2 py-0.5 rounded-lg border border-slate-100 uppercase tracking-wider">
                                                    Grade {asset.grade_level}
                                                </span>
                                            </div>
                                            <h3 className="text-base font-black text-slate-900 leading-tight mb-3 group-hover:text-primary transition-colors">
                                                {asset.title}
                                            </h3>
                                            <div className="flex items-center gap-2 text-slate-400">
                                                <div className="w-5 h-5 bg-slate-100 rounded-full flex items-center justify-center">
                                                    <User className="w-3 h-3" />
                                                </div>
                                                <p className="text-[10px] font-bold">{asset.profiles?.full_name || "Community Teacher"}</p>
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-2">
                                            <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 bg-slate-50 px-2 py-1.5 rounded-xl border border-slate-100/50">
                                                <Share2 className="w-3 h-3" />
                                                {asset.clones_count || 0}
                                            </div>
                                            <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 bg-slate-50 px-2 py-1.5 rounded-xl border border-slate-100/50">
                                                <Heart className="w-3 h-3" />
                                                {asset.likes_count || 0}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-6 flex gap-3">
                                        <button
                                            onClick={() => handleRemix(asset.id)}
                                            disabled={isRemixing === asset.id}
                                            className="flex-1 bg-slate-900 text-white font-black py-3 rounded-2xl flex items-center justify-center gap-2 text-xs hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-50"
                                        >
                                            {isRemixing === asset.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Copy className="w-3.5 h-3.5 text-primary" />}
                                            Remix to My Library
                                        </button>
                                        <button className="bg-slate-100 p-3 rounded-2xl text-slate-600 hover:bg-slate-200 transition-all active:scale-95">
                                            <Download className="w-4 h-4" />
                                        </button>
                                    </div>

                                    <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity">
                                        {asset.asset_type === 'quiz' ? <FileText className="w-24 h-24" /> : <BookOpen className="w-24 h-24" />}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
            <BottomNav />
        </main>
    );
}
