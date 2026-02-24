"use client";

import { useState } from "react";

export function Step1Academic({ onNext }: { onNext: () => void }) {
    const [degree, setDegree] = useState("");
    const [year, setYear] = useState("");

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Welcome to SargVision</h1>
            <p className="text-slate-500 mb-8">Let's personalize your career co-pilot. What are you studying?</p>

            <div className="space-y-6">
                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Degree Type</label>
                    <select
                        value={degree}
                        onChange={(e) => setDegree(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white/80 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition appearance-none"
                    >
                        <option value="" disabled>Select your degree...</option>
                        <option value="BTech">B.Tech / B.E.</option>
                        <option value="MBBS">MBBS / Medical</option>
                        <option value="BA">B.A. (Arts/Humanities)</option>
                        <option value="BCom">B.Com</option>
                        <option value="BSc">B.Sc</option>
                        <option value="Other">Other</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Current Year</label>
                    <div className="grid grid-cols-4 gap-3">
                        {["1st", "2nd", "3rd", "4th+"].map((y) => (
                            <button
                                key={y}
                                onClick={() => setYear(y)}
                                className={`py-2 rounded-xl border text-sm font-medium transition-all ${year === y
                                    ? "border-primary bg-primary/5 text-primary"
                                    : "border-slate-200 text-slate-500 hover:border-slate-300 bg-white/50"}`}
                            >
                                {y}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <button
                onClick={onNext}
                disabled={!degree || !year}
                className="btn-primary w-full mt-10 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                Continue →
            </button>
        </div>
    );
}
