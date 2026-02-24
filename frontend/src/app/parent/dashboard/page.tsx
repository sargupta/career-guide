"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { Loader2, Plus, Send, TrendingUp, Award, MessageSquare } from "lucide-react";

interface Student {
    id: string;
    full_name: string;
    domain: string;
    readiness_pct: number;
}

interface StudentReport {
    profile: any;
    achievements_count: number;
    readiness_history: any[];
}

export default function ParentDashboard() {
    const [students, setStudents] = useState<any[]>([]);
    const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
    const [report, setReport] = useState<StudentReport | null>(null);
    const [nudge, setNudge] = useState("");
    const [loading, setLoading] = useState(true);
    const [sendingNudge, setSendingNudge] = useState(false);

    useEffect(() => {
        async function init() {
            try {
                const data = await apiFetch("/parent/students");
                setStudents(data.students || []);
                if (data.students?.length > 0) {
                    const activeLink = data.students.find((s: any) => s.status === 'active');
                    if (activeLink) {
                        setSelectedStudentId(activeLink.student_id);
                    }
                }
            } catch (err) {
                console.error("Failed to load students", err);
            } finally {
                setLoading(false);
            }
        }
        init();
    }, []);

    useEffect(() => {
        if (selectedStudentId) {
            fetchReport(selectedStudentId);
        }
    }, [selectedStudentId]);

    async function fetchReport(id: string) {
        try {
            const data = await apiFetch(`/parent/students/${id}/report`);
            setReport(data);
        } catch (err) {
            console.error("Failed to load report", err);
        }
    }

    async function handleSendNudge() {
        if (!selectedStudentId || !nudge.trim()) return;
        setSendingNudge(true);
        try {
            await apiFetch("/parent/nudges", {
                method: "POST",
                body: JSON.stringify({ student_id: selectedStudentId, content: nudge })
            });
            setNudge("");
            alert("Nudge sent to AI Mentor!");
        } catch (err) {
            console.error("Failed to send nudge", err);
        } finally {
            setSendingNudge(false);
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-surface">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    const activeStudentLink = students.find(s => s.student_id === selectedStudentId);

    return (
        <div className="min-h-screen bg-surface">
            {/* Header */}
            <header className="sticky top-0 z-40 glass border-b border-white/40 px-4 py-4">
                <div className="max-max-w-2xl mx-auto flex items-center justify-between">
                    <div>
                        <h1 className="font-bold text-slate-800 text-lg">Parental Dashboard</h1>
                        <p className="text-xs text-slate-400">Monitoring student career journeys</p>
                    </div>
                    <button className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                        <Plus className="w-4 h-4" />
                    </button>
                </div>
            </header>

            <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
                {/* Student Selector */}
                <div className="flex gap-3 overflow-x-auto pb-2">
                    {students.map((link) => (
                        <button
                            key={link.student_id}
                            onClick={() => setSelectedStudentId(link.student_id)}
                            className={`flex-shrink-0 px-4 py-2 rounded-xl border text-sm font-medium transition-all ${selectedStudentId === link.student_id
                                    ? "bg-primary text-white border-primary shadow-lg shadow-primary/20"
                                    : "bg-white border-slate-200 text-slate-600"
                                }`}
                        >
                            {link.profiles?.[0]?.full_name || "Student"}
                        </button>
                    ))}
                </div>

                {report ? (
                    <>
                        {/* Readiness Overview */}
                        <div className="glass p-5 border-t-2 border-primary">
                            <div className="flex items-center gap-2 mb-4">
                                <TrendingUp className="w-5 h-5 text-primary" />
                                <h2 className="font-bold text-slate-800">Current Readiness</h2>
                            </div>
                            <div className="text-center py-6">
                                <div className="text-5xl font-extrabold text-primary mb-1">
                                    {report.profile?.readiness_pct || 0}%
                                </div>
                                <p className="text-xs text-slate-400 uppercase tracking-widest font-bold">Career Readiness Score</p>
                            </div>
                            <div className="readiness-bar h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-primary transition-all duration-1000"
                                    style={{ width: `${report.profile?.readiness_pct || 0}%` }}
                                />
                            </div>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="glass-sm p-4 text-center">
                                <Award className="w-6 h-6 text-amber-400 mx-auto mb-2" />
                                <p className="text-2xl font-bold text-slate-800">{report.achievements_count}</p>
                                <p className="text-[10px] text-slate-400 uppercase font-bold">Achievements</p>
                            </div>
                            <div className="glass-sm p-4 text-center">
                                <MessageSquare className="w-6 h-6 text-accent mx-auto mb-2" />
                                <p className="text-2xl font-bold text-slate-800">12</p>
                                <p className="text-[10px] text-slate-400 uppercase font-bold">Mentor Sessions</p>
                            </div>
                        </div>

                        {/* Nudge Composer */}
                        <div className="glass p-5 border-l-4 border-accent">
                            <div className="mb-4">
                                <h3 className="font-bold text-slate-800 text-sm">Send a Nudge to AI</h3>
                                <p className="text-xs text-slate-500 italic">"AI Mentor will naturally mention your advice during their next chat."</p>
                            </div>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={nudge}
                                    onChange={(e) => setNudge(e.target.value)}
                                    placeholder="e.g. Focus on upcoming hackathons..."
                                    className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20"
                                />
                                <button
                                    onClick={handleSendNudge}
                                    disabled={sendingNudge || !nudge.trim()}
                                    className="bg-accent text-white p-2 rounded-xl shadow-lg shadow-accent/20 disabled:opacity-50"
                                >
                                    {sendingNudge ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="glass p-12 text-center text-slate-400">
                        <p className="text-sm">Select a student or invite one to start monitoring.</p>
                    </div>
                )}
            </main>
        </div>
    );
}
