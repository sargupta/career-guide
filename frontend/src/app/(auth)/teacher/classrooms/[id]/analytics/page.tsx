"use client";

import Link from "next/link";
import { ArrowLeft, BarChart3, ChevronRight, GraduationCap, Heart, Loader2, MessageSquare, MoreVertical, Sparkles, Star, TrendingUp, Users } from "lucide-react";
import { BottomNav } from "@/components/ui/BottomNav";
import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import { useParams } from "next/navigation";

export default function BatchAnalytics() {
    const params = useParams();
    const classroomId = params.id;
    const [students, setStudents] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [praisingId, setPraisingId] = useState<string | null>(null);

    useEffect(() => {
        if (classroomId) fetchStudents();
    }, [classroomId]);

    const fetchStudents = async () => {
        try {
            // Fetch students and their submissions for this classroom
            const res = await apiFetch(`/classroom/teacher/${classroomId}/students`);
            setStudents(res.students || []);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const handlePraise = async (studentId: string, name: string) => {
        setPraisingId(studentId);
        try {
            await apiFetch(`/teacher/students/${studentId}/praise`, {
                method: "POST",
                body: JSON.stringify({
                    message: `${name} is showing exceptional progress in our ${students[0]?.subject || 'current'} module!`
                })
            });
            alert(`Praise nudge sent to ${name}'s parents!`);
        } catch (e) {
            console.error(e);
        } finally {
            setPraisingId(null);
        }
    };

    return (
        <main className="min-h-screen bg-slate-50 pb-24">
            <div className="max-w-2xl mx-auto px-4 py-8">
                {/* Header */}
                <header className="flex items-center gap-4 mb-8">
                    <Link href="/teacher/classrooms" className="p-2 hover:bg-white rounded-xl transition-colors text-slate-500 shadow-sm">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 leading-none mb-1">Batch Insights</h1>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Performance Radar</p>
                    </div>
                </header>

                {/* Performance Summary */}
                <section className="bg-slate-900 rounded-[2.5rem] p-8 text-white mb-8 relative overflow-hidden shadow-xl shadow-slate-900/20">
                    <div className="absolute top-0 right-0 p-10 opacity-10">
                        <TrendingUp className="w-32 h-32" />
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-6">
                            <BarChart3 className="w-5 h-5 text-primary" />
                            <h2 className="text-sm font-black uppercase tracking-widest opacity-60">Collective Mastery</h2>
                        </div>
                        <div className="grid grid-cols-2 gap-8">
                            <div>
                                <p className="text-3xl font-black mb-1">84%</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Avg. Quiz Score</p>
                            </div>
                            <div>
                                <p className="text-3xl font-black mb-1">{students.length}</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Active Students</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Students List */}
                <section>
                    <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6 flex items-center gap-2">
                        <GraduationCap className="w-4 h-4 text-slate-400" />
                        Student Submissions
                    </h2>

                    {isLoading ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="w-8 h-8 text-primary animate-spin" />
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {students.length === 0 ? (
                                <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-slate-200">
                                    <p className="text-xs text-slate-400 font-bold">No students enrolled in this batch yet.</p>
                                </div>
                            ) : (
                                students.map((enrollment) => (
                                    <div key={enrollment.id} className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm flex items-center justify-between group hover:border-primary/20 transition-all">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-primary/5 group-hover:text-primary transition-colors">
                                                <Star className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-black text-slate-900">{enrollment.profiles?.full_name}</h3>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                                                    {enrollment.profiles?.email}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={() => handlePraise(enrollment.student_id, enrollment.profiles?.full_name)}
                                                disabled={praisingId === enrollment.student_id}
                                                className="bg-primary/10 text-primary p-3 rounded-2xl hover:bg-primary hover:text-white transition-all shadow-sm flex items-center gap-2 group/btn"
                                            >
                                                {praisingId === enrollment.student_id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Heart className="w-4 h-4 fill-current group-hover/btn:scale-110 transition-transform" />}
                                            </button>
                                            <button className="bg-slate-50 p-3 rounded-2xl text-slate-400 hover:bg-slate-100 transition shadow-sm">
                                                <MoreVertical className="w-4 h-4" />
                                            </button>
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
