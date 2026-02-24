"use client";

import Link from "next/link";
import { ArrowLeft, ChevronRight, Copy, GraduationCap, LayoutDashboard, Loader2, Plus, QrCode, Search, Share2, Users, Wand2 } from "lucide-react";
import { BottomNav } from "@/components/ui/BottomNav";
import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";

export default function TeacherClassrooms() {
    const [classrooms, setClassrooms] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);

    // New Class Form
    const [name, setName] = useState("");
    const [subject, setSubject] = useState("Science");
    const [grade, setGrade] = useState("10");

    useEffect(() => {
        fetchClassrooms();
    }, []);

    const fetchClassrooms = async () => {
        try {
            const res = await apiFetch("/classroom/teacher/list");
            setClassrooms(res.classrooms || []);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!name) return;
        setIsCreating(true);
        try {
            await apiFetch("/classroom/teacher/create", {
                method: "POST",
                body: JSON.stringify({ name, subject, grade_level: grade })
            });
            setName("");
            await fetchClassrooms();
        } catch (e) {
            console.error(e);
        } finally {
            setIsCreating(false);
        }
    };

    const copyCode = (code: string) => {
        navigator.clipboard.writeText(code);
        alert("Join code copied!");
    };

    return (
        <main className="min-h-screen bg-slate-50 pb-24">
            <div className="max-w-2xl mx-auto px-4 py-8">
                {/* Header */}
                <header className="flex items-center gap-4 mb-8">
                    <Link href="/teacher/dashboard" className="p-2 hover:bg-white rounded-xl transition-colors text-slate-500 shadow-sm">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 leading-none mb-1">Batch Management</h1>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">SahayakAI Classroom</p>
                    </div>
                </header>

                {/* Create Class Card */}
                <section className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-100 mb-8 overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-8 opacity-5">
                        <Users className="w-24 h-24 text-primary" />
                    </div>

                    <h2 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
                        <Plus className="w-5 h-5 text-primary" />
                        Identify New Batch
                    </h2>

                    <div className="space-y-4 relative z-10">
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase ml-2 mb-1.5 block">Batch Name</label>
                            <input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g. 10th-A Science, Morning Physics..."
                                className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-primary/20 transition-all shadow-inner"
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

                        <button
                            onClick={handleCreate}
                            disabled={!name || isCreating}
                            className="w-full bg-primary text-white font-black py-4 rounded-2xl shadow-lg shadow-primary/20 hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50 mt-2"
                        >
                            {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                            Create Batch
                        </button>
                    </div>
                </section>

                {/* Classrooms List */}
                <section>
                    <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6 flex items-center gap-2">
                        <GraduationCap className="w-4 h-4 text-slate-400" />
                        Active Batches
                    </h2>

                    {isLoading ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="w-8 h-8 text-primary animate-spin" />
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {classrooms.length === 0 ? (
                                <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-slate-200">
                                    <p className="text-xs text-slate-400 font-bold">No active batches created yet.</p>
                                </div>
                            ) : (
                                classrooms.map((room) => (
                                    <div key={room.id} className="bg-white rounded-[2.5rem] p-6 border border-slate-100 shadow-sm relative group overflow-hidden">
                                        <div className="flex items-start justify-between relative z-10">
                                            <div>
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="text-[9px] font-black px-2 py-0.5 rounded-lg uppercase tracking-wider bg-slate-100 text-slate-500">
                                                        Grade {room.grade_level}
                                                    </span>
                                                    <span className="text-[9px] font-black bg-primary/10 text-primary px-2 py-0.5 rounded-lg uppercase tracking-wider">
                                                        {room.subject}
                                                    </span>
                                                </div>
                                                <h3 className="text-lg font-black text-slate-900 group-hover:text-primary transition-colors">{room.name}</h3>
                                                <div className="flex items-center gap-4 mt-4">
                                                    <div className="flex items-center gap-1.5">
                                                        <Users className="w-3.5 h-3.5 text-slate-400" />
                                                        <span className="text-[10px] font-black text-slate-600">{room.classroom_enrollments?.[0]?.count || 0} Students</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 bg-slate-900 text-white px-3 py-1.5 rounded-xl">
                                                        <span className="text-[10px] font-black tracking-widest">{room.join_code}</span>
                                                        <button onClick={() => copyCode(room.join_code)} className="p-0.5 hover:bg-white/20 rounded transition">
                                                            <Copy className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>

                                            <button className="bg-slate-50 p-3 rounded-2xl group-hover:bg-primary group-hover:text-white transition-all shadow-sm">
                                                <ChevronRight className="w-5 h-5" />
                                            </button>
                                        </div>

                                        <div className="absolute top-0 right-0 p-8 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity">
                                            <QrCode className="w-24 h-24" />
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
