"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/api";
import { Loader2 } from "lucide-react";

const DOMAINS = [
    "Engineering & Tech",
    "Medicine & Health",
    "Commerce & Business",
    "Arts & Humanities",
    "Government & Civic",
    "Creative & Media",
    "Science & Research",
    "Law & Legal",
    "Exploring/Undecided"
];

export function Step2Domain({ onNext }: { onNext: () => void }) {
    const [selected, setSelected] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!selected) return;
        setLoading(true);
        try {
            // Assume the string name connects or we adjust backend logic to handle strings.
            await apiFetch("/users/me", {
                method: "PUT",
                body: JSON.stringify({ domain_id: selected }),
            });
            onNext();
        } catch (error) {
            console.error("Failed to save domain:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Choose your domain</h1>
            <p className="text-slate-500 mb-8">What broad field are you aiming for? You can change this later.</p>

            <div className="grid grid-cols-1 gap-3">
                {DOMAINS.map((domain) => (
                    <button
                        key={domain}
                        onClick={() => setSelected(domain)}
                        className={`px-4 py-3 rounded-xl border text-left text-sm font-medium transition-all flex items-center justify-between ${selected === domain
                            ? "border-primary bg-primary/5 text-primary ring-1 ring-primary/20"
                            : "border-slate-200 text-slate-600 hover:border-slate-300 bg-white/50"}`}
                    >
                        {domain}
                        {selected === domain && (
                            <span className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                            </span>
                        )}
                    </button>
                ))}
            </div>

            <button
                onClick={handleSubmit}
                disabled={!selected || loading}
                className="btn-primary w-full mt-8 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Continue →
            </button>
        </div>
    );
}
