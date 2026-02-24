"use client";

import Link from "next/link";
import { ArrowLeft, Plus, Award, Briefcase, BookOpen, Trophy, GraduationCap, X, Loader2, Upload, ScanLine } from "lucide-react";
import { BottomNav } from "@/components/ui/BottomNav";
import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";

type ActivityType = "achievement" | "internship" | "course" | "project" | "certification";

interface Activity {
    id: string;
    type: ActivityType;
    title: string;
    details_json?: { detail?: string };
    academic_year: string;
    semester?: string;
    verified?: boolean;
}

const typeConfig: Record<ActivityType, { icon: React.ReactNode; color: string; label: string }> = {
    achievement: { icon: <Trophy className="w-4 h-4" />, color: "bg-amber-100 text-amber-600", label: "Achievement" },
    internship: { icon: <Briefcase className="w-4 h-4" />, color: "bg-blue-100 text-blue-600", label: "Internship" },
    course: { icon: <BookOpen className="w-4 h-4" />, color: "bg-violet-100 text-violet-600", label: "Course" },
    project: { icon: <GraduationCap className="w-4 h-4" />, color: "bg-emerald-100 text-emerald-600", label: "Project" },
    certification: { icon: <Award className="w-4 h-4" />, color: "bg-primary/10 text-primary", label: "Certification" },
};

const filterTypes: (ActivityType | "all")[] = ["all", "achievement", "internship", "course", "project", "certification"];

// Fallback demo data when API is not available
const demoActivities: Activity[] = [
    { id: "1", type: "achievement", title: "IEEE SRM Hackathon", details_json: { detail: "2nd Place · Led a 4-person team building an AI-powered resume analyzer." }, academic_year: "Year 2", semester: "Sem 1", verified: true },
    { id: "2", type: "internship", title: "TechCorp Internship", details_json: { detail: "Backend Developer · Built REST APIs using FastAPI and deployed on AWS." }, academic_year: "Year 1", semester: "Summer", verified: true },
    { id: "3", type: "course", title: "Google Data Analytics Certificate", details_json: { detail: "6-month professional certificate course on Coursera." }, academic_year: "Year 1", verified: false },
    { id: "4", type: "certification", title: "AWS Cloud Practitioner", details_json: { detail: "Foundational certification covering core AWS cloud concepts." }, academic_year: "Year 1", semester: "Sem 2", verified: true },
    { id: "5", type: "project", title: "Campus Event Portal", details_json: { detail: "Built a web app for managing college events using Next.js and Supabase." }, academic_year: "Year 1", semester: "Sem 1", verified: false },
];

export default function TimelinePage() {
    const [activities, setActivities] = useState<Activity[]>([]);
    const [activeFilter, setActiveFilter] = useState<ActivityType | "all">("all");
    const [isLoading, setIsLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [modalTab, setModalTab] = useState<"manual" | "ai">("manual");
    const [saving, setSaving] = useState(false);
    const [extracting, setExtracting] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const [form, setForm] = useState({
        type: "project" as ActivityType,
        title: "",
        detail: "",
        academic_year: "Year 1",
        semester: "Sem 1",
    });

    useEffect(() => {
        async function fetchActivities() {
            try {
                const data = await apiFetch("/activities");
                setActivities(data.activities?.length > 0 ? data.activities : demoActivities);
            } catch {
                setActivities(demoActivities);
            } finally {
                setIsLoading(false);
            }
        }
        fetchActivities();
    }, []);

    const filtered = activeFilter === "all" ? activities : activities.filter((a) => a.type === activeFilter);

    const handleAdd = async () => {
        if (!form.title.trim()) return;
        setSaving(true);
        try {
            const data = await apiFetch("/activities", {
                method: "POST",
                body: JSON.stringify({
                    type: form.type,
                    title: form.title,
                    detail: form.detail,
                    academic_year: form.academic_year,
                    semester: form.semester,
                }),
            });
            setActivities((prev) => [data.activity, ...prev]);
        } catch {
            // Add optimistically on error
            const optimistic: Activity = {
                id: Date.now().toString(),
                type: form.type,
                title: form.title,
                details_json: { detail: form.detail },
                academic_year: form.academic_year,
                semester: form.semester,
                verified: false,
            };
            setActivities((prev) => [optimistic, ...prev]);
        } finally {
            setSaving(false);
            setShowModal(false);
            setModalTab("manual");
            setForm({ type: "project", title: "", detail: "", academic_year: "Year 1", semester: "Sem 1" });
        }
    };

    const handleFileDrop = async (e: React.ChangeEvent<HTMLInputElement> | React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        let file: File | null = null;

        if ('dataTransfer' in e) {
            file = e.dataTransfer.files[0];
        } else if (e.target.files) {
            file = e.target.files[0];
        }

        if (!file) return;

        setExtracting(true);
        const formData = new FormData();
        formData.append("file", file);

        try {
            const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
            // We need to use native fetch here to send FormData (apiFetch forces application/json)
            const token = localStorage.getItem("sb-szlyvclqozdndvixjwwm-auth-token") ?
                JSON.parse(localStorage.getItem("sb-szlyvclqozdndvixjwwm-auth-token")!).access_token : "";

            const res = await fetch(`${API_BASE_URL}/activities/extract-certificate`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`
                },
                body: formData
            });

            if (!res.ok) throw new Error("Failed to extract");
            const data = await res.json();

            if (data.status === "success" && data.extracted) {
                setForm({
                    ...form,
                    title: data.extracted.title,
                    type: data.extracted.type as ActivityType,
                    detail: data.extracted.detail,
                });
                setModalTab("manual"); // Switch to manual tab so they can review/edit and save
            }
        } catch (err) {
            console.error("AI Extraction failed:", err);
            alert("Failed to analyze certificate. Please enter manually.");
        } finally {
            setExtracting(false);
            setDragActive(false);
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
                                <h1 className="font-bold text-slate-800">Activity Timeline</h1>
                                <p className="text-xs text-slate-400">{activities.length} logged activities</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowModal(true)}
                            className="flex items-center gap-1.5 bg-primary text-white text-xs font-semibold px-3 py-2 rounded-xl hover:bg-primary/90 transition-colors"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            Add Activity
                        </button>
                    </div>
                </header>

                {/* Type Filter Chips */}
                <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
                    {filterTypes.map((f) => (
                        <button
                            key={f}
                            onClick={() => setActiveFilter(f)}
                            className={`flex-shrink-0 text-xs font-semibold px-4 py-2 rounded-full border transition-all ${activeFilter === f
                                ? "bg-primary text-white border-primary shadow-sm"
                                : "bg-white/60 text-slate-500 border-slate-200 hover:border-primary/50 hover:text-primary"
                                }`}
                        >
                            {f.charAt(0).toUpperCase() + f.slice(1)}
                        </button>
                    ))}
                </div>

                {/* Timeline */}
                {isLoading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="w-8 h-8 text-primary animate-spin" />
                    </div>
                ) : (
                    <div className="relative">
                        <div className="absolute left-5 top-0 bottom-0 w-px bg-slate-200" />
                        <div className="space-y-4">
                            {filtered.map((activity) => {
                                const config = typeConfig[activity.type] || typeConfig.project;
                                const detail = activity.details_json?.detail || "";
                                return (
                                    <div key={activity.id} className="flex gap-4">
                                        <div className={`w-10 h-10 rounded-full ${config.color} flex items-center justify-center flex-shrink-0 relative z-10 border-2 border-white shadow-sm`}>
                                            {config.icon}
                                        </div>
                                        <div className="flex-1 glass p-4 rounded-2xl mb-1">
                                            <div className="flex items-start justify-between gap-2 mb-1">
                                                <div>
                                                    <p className="text-sm font-bold text-slate-800">{activity.title}</p>
                                                    {detail && <p className="text-xs text-slate-500 mt-0.5">{detail}</p>}
                                                </div>
                                                {activity.verified && (
                                                    <span className="flex-shrink-0 text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">
                                                        ✓ Verified
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center justify-between mt-2">
                                                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${config.color}`}>
                                                    {config.label}
                                                </span>
                                                <span className="text-[10px] text-slate-400">
                                                    {activity.semester ? `${activity.semester}, ` : ""}{activity.academic_year}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            {filtered.length === 0 && (
                                <div className="text-center py-12 text-slate-400 text-sm">
                                    No activities found. Add one to get started!
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Add Activity Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)} />
                    <div className="relative w-full max-w-md glass rounded-3xl p-6 space-y-4 shadow-2xl">
                        <div className="flex items-center justify-between">
                            <h2 className="font-bold text-slate-800">Log Activity</h2>
                            <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors text-slate-400">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="flex bg-slate-100 rounded-xl p-1">
                            <button
                                onClick={() => setModalTab("manual")}
                                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors ${modalTab === "manual" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                            >
                                Manual Entry
                            </button>
                            <button
                                onClick={() => setModalTab("ai")}
                                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 ${modalTab === "ai" ? "bg-white text-primary shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                            >
                                <ScanLine className="w-3.5 h-3.5" /> AI Scan
                            </button>
                        </div>

                        {modalTab === "ai" ? (
                            <div
                                className={`border-2 border-dashed rounded-2xl p-8 text-center transition-colors relative
                                    ${dragActive ? "border-primary bg-primary/5" : "border-slate-200 hover:border-primary/50"}
                                `}
                                onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                                onDragLeave={() => setDragActive(false)}
                                onDrop={handleFileDrop}
                            >
                                <input
                                    type="file"
                                    accept="image/*,application/pdf"
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    onChange={handleFileDrop}
                                    disabled={extracting}
                                />

                                {extracting ? (
                                    <div className="space-y-3">
                                        <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto" />
                                        <p className="text-sm font-semibold text-primary">Analyzing Document...</p>
                                        <p className="text-xs text-slate-500">Extracting details via Gemini Vision</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-2">
                                            <Upload className="w-6 h-6" />
                                        </div>
                                        <p className="text-sm font-bold text-slate-800">Drop your certificate</p>
                                        <p className="text-xs text-slate-500">Image or PDF. We'll extract the title, date, and details to auto-fill the form.</p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <>
                                <div className="space-y-3">
                                    <select
                                        value={form.type}
                                        onChange={(e) => setForm({ ...form, type: e.target.value as ActivityType })}
                                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white/80 text-sm focus:outline-none focus:border-primary text-slate-700"
                                    >
                                        {(Object.keys(typeConfig) as ActivityType[]).map((t) => (
                                            <option key={t} value={t}>{typeConfig[t].label}</option>
                                        ))}
                                    </select>
                                    <input
                                        placeholder="Title (e.g. ICPC 2026)"
                                        value={form.title}
                                        onChange={(e) => setForm({ ...form, title: e.target.value })}
                                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white/80 text-sm focus:outline-none focus:border-primary placeholder:text-slate-400"
                                    />
                                    <textarea
                                        placeholder="Brief description (optional)"
                                        value={form.detail}
                                        onChange={(e) => setForm({ ...form, detail: e.target.value })}
                                        rows={2}
                                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white/80 text-sm focus:outline-none focus:border-primary placeholder:text-slate-400 resize-none"
                                    />
                                    <div className="grid grid-cols-2 gap-2">
                                        <select
                                            value={form.academic_year}
                                            onChange={(e) => setForm({ ...form, academic_year: e.target.value })}
                                            className="px-3 py-2.5 rounded-xl border border-slate-200 bg-white/80 text-sm focus:outline-none focus:border-primary text-slate-700"
                                        >
                                            {["Year 1", "Year 2", "Year 3", "Year 4"].map((y) => <option key={y}>{y}</option>)}
                                        </select>
                                        <select
                                            value={form.semester}
                                            onChange={(e) => setForm({ ...form, semester: e.target.value })}
                                            className="px-3 py-2.5 rounded-xl border border-slate-200 bg-white/80 text-sm focus:outline-none focus:border-primary text-slate-700"
                                        >
                                            {["Sem 1", "Sem 2", "Summer"].map((s) => <option key={s}>{s}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <button
                                    onClick={handleAdd}
                                    disabled={saving || !form.title.trim()}
                                    className="w-full bg-primary text-white font-semibold py-3 rounded-xl hover:bg-primary/90 disabled:bg-slate-200 disabled:text-slate-400 transition-colors flex items-center justify-center gap-2"
                                >
                                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                                    {saving ? "Saving..." : "Log Activity"}
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}

            <BottomNav />
        </main>
    );
}
