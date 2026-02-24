"use client";

import Link from "next/link";
import { ArrowLeft, BookOpen, Calendar, ChevronRight, GraduationCap, LayoutDashboard, Loader2, LogIn, Plus, Rocket, Sparkles, User, Users } from "lucide-react";
import { BottomNav } from "@/components/ui/BottomNav";
import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";

export default function StudentClassrooms() {
    const [assignments, setAssignments] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [joinCode, setJoinCode] = useState("");
    const [isJoining, setIsJoining] = useState(false);

    useEffect(() => {
        fetchAssignments();
    }, []);

    const fetchAssignments = async () => {
        try {
            const res = await apiFetch("/classroom/student/assignments");
            setAssignments(res.assignments || []);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleJoin = async () => {
        if (!joinCode) return;
        setIsJoining(true);
        try {
            await apiFetch("/classroom/student/join", {
                method: "POST",
                body: JSON.stringify({ join_code: joinCode })
            });
            setJoinCode("");
            alert("Successfully joined classroom!");
            await fetchAssignments();
        } catch (e) {
            alert("Invalid or expired join code.");
        } finally {
            setIsJoining(false);
        }
    };

    const handleTakeAssignment = async (assignmentId: string) => {
        const confirm = window.confirm("Ready to start this task?");
        if (!confirm) return;

        try {
            // Simulated quiz submission (in a real app, this would open a quiz UI)
            await apiFetch(`/classroom/student/assignments/${assignmentId}/submit`, {
                method: "POST",
                body: JSON.stringify({
                    answers_json: {
                        q1: "Option A",
                        q2: "Option B",
                        q3: "Option C"
                    }
                })
            });
            alert("Assignment submitted! Your teacher will grade it soon.");
            await fetchAssignments();
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <main className="min-h-screen bg-slate-50 pb-24">
            <div className="max-w-2xl mx-auto px-4 py-8">
                {/* Header */}
                <header className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center shadow-lg shadow-slate-900/10">
                            <Users className="text-white w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-slate-900 leading-none mb-1">Classrooms</h1>
                            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Connect with Teachers</p>
                        </div>
                    </div>
                </header>

                {/* Join Classroom Card */}
                <section className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-100 mb-8 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:rotate-12 transition-transform">
                        <Rocket className="w-20 h-20 text-primary" />
                    </div>

                    <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <LogIn className="w-4 h-4 text-primary" />
                        Join a New Batch
                    </h2>

                    <div className="flex gap-3 relative z-10">
                        <input
                            value={joinCode}
                            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                            placeholder="Enter 6-digit Code"
                            maxLength={6}
                            className="flex-1 bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-black text-slate-900 tracking-[0.2em] uppercase placeholder:text-slate-300 placeholder:tracking-normal focus:ring-2 focus:ring-primary/20 transition-all shadow-inner"
                        />
                        <button
                            onClick={handleJoin}
                            disabled={!joinCode || isJoining}
                            className="bg-primary text-white font-black px-6 rounded-2xl shadow-lg shadow-primary/20 hover:scale-[1.05] active:scale-95 transition-all text-xs disabled:opacity-50"
                        >
                            {isJoining ? <Loader2 className="w-4 h-4 animate-spin" /> : "JOIN"}
                        </button>
                    </div>
                </section>

                {/* Assignments / Tasks */}
                <section>
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                            <BookOpen className="w-4 h-4 text-slate-400" />
                            Assigned by Teachers
                        </h2>
                        <span className="bg-slate-200 text-slate-600 text-[10px] font-black px-2 py-0.5 rounded-full">{assignments.length}</span>
                    </div>

                    {isLoading ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="w-8 h-8 text-primary animate-spin" />
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {assignments.length === 0 ? (
                                <div className="text-center py-16 bg-white rounded-[2.5rem] border border-dashed border-slate-200">
                                    <Sparkles className="w-10 h-10 text-slate-100 mx-auto mb-4" />
                                    <p className="text-xs text-slate-400 font-bold max-w-[200px] mx-auto">No assignments from your teachers yet.</p>
                                </div>
                            ) : (
                                assignments.map((task) => (
                                    <div key={task.id} className="bg-white rounded-[2rem] p-5 border border-slate-100 shadow-sm flex items-center justify-between group hover:border-primary/20 transition-all">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-sm">
                                                <GraduationCap className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-black text-slate-900 leading-tight mb-1">{task.teacher_assets?.title}</h3>
                                                <div className="flex items-center gap-3">
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                                                        {task.classrooms?.name}
                                                    </p>
                                                    <div className="flex items-center gap-1 text-[9px] font-black text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-md">
                                                        <Calendar className="w-2.5 h-2.5" />
                                                        {task.deadline ? new Date(task.deadline).toLocaleDateString() : "No Deadline"}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleTakeAssignment(task.id)}
                                            className="bg-slate-900 text-white text-[10px] font-black px-4 py-2 rounded-xl shadow-lg shadow-slate-900/10 hover:scale-105 active:scale-95 transition-all"
                                        >
                                            START
                                        </button>
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
