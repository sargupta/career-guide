"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// ── Types ────────────────────────────────────────────────────────────────────
interface Answer {
    primary_goal: string;
    learning_style: string;
    biggest_worry: string;
    device_quality: string;
    language_pref: string;
}

const STEPS = [
    {
        key: "primary_goal",
        question: "What's your main goal right now? 🎯",
        subtitle: "We'll personalise your entire experience around this.",
        options: [
            { value: "maang", label: "🚀 Land a FAANG / MAANG job", desc: "Google, Meta, Amazon, Flipkart" },
            { value: "research", label: "🔬 Research / PhD Track", desc: "IISc, IIT, Global R&D Labs" },
            { value: "govt", label: "🏛️ Crack a Govt Exam", desc: "UPSC, SSC, GATE, Bank PO" },
            { value: "creative", label: "🎨 Build a Creative Career", desc: "Design, Film, Content, Art" },
            { value: "stable_job", label: "💼 Get a Stable Job Fast", desc: "Any good placement this year" },
            { value: "explore", label: "🧭 I'm still exploring...", desc: "Help me figure it out" },
        ],
    },
    {
        key: "learning_style",
        question: "How do you best absorb information? 🧠",
        subtitle: "Your AI mentor will adapt its teaching style for you.",
        options: [
            { value: "visual", label: "📹 Videos & Visuals", desc: "YouTube, Reels, Diagrams" },
            { value: "text", label: "📖 Text & Deep Reading", desc: "Articles, Books, Docs" },
            { value: "audio", label: "🎙️ Audio & Voice", desc: "Podcasts, Voice Notes" },
            { value: "bullets", label: "⚡ Quick Bullet Points", desc: "Short, fast, snappy" },
        ],
    },
    {
        key: "biggest_worry",
        question: "What's your biggest worry right now? 😟",
        subtitle: "Be honest — we'll work on this together.",
        options: [
            { value: "placement", label: "🎓 I won't get placed", desc: "Missing out on campus roles" },
            { value: "financial", label: "💰 I need to earn, fast", desc: "Financial pressure is real" },
            { value: "lost", label: "🌀 I feel lost / unsure", desc: "Don't know what to do" },
            { value: "exam_prep", label: "📝 My exam prep is slow", desc: "Need to move faster" },
            { value: "competition", label: "🏆 My peers are ahead of me", desc: "Comparison & FOMO" },
        ],
    },
    {
        key: "device_quality",
        question: "What device do you mostly use? 📱",
        subtitle: "We'll optimise your experience for your setup.",
        options: [
            { value: "basic_android", label: "📱 Basic Android", desc: "Budget phone, limited data" },
            { value: "mid_range", label: "📲 Mid-range Android", desc: "Good phone, decent data" },
            { value: "high_end", label: "💻 Laptop / iPhone", desc: "High-end, great connectivity" },
        ],
    },
    {
        key: "language_pref",
        question: "How do you prefer to communicate? 🗣️",
        subtitle: "Your AI mentor will speak in your language.",
        options: [
            { value: "en", label: "🇬🇧 English", desc: "Formal / Corporate tone" },
            { value: "hinglish", label: "🇮🇳 Hinglish", desc: "Mix of Hindi + English" },
            { value: "hi", label: "🇮🇳 Hindi", desc: "Mostly Hindi" },
        ],
    },
];

// ── Component ────────────────────────────────────────────────────────────────
export default function PersonaOnboardingPage() {
    const router = useRouter();
    const [step, setStep] = useState(0);
    const [answers, setAnswers] = useState<Partial<Answer>>({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const current = STEPS[step];
    const progress = Math.round(((step) / STEPS.length) * 100);

    const handleSelect = async (value: string) => {
        const updated = { ...answers, [current.key]: value };
        setAnswers(updated);

        if (step < STEPS.length - 1) {
            setStep(step + 1);
        } else {
            // Last step — submit
            await submitPersona(updated as Answer);
        }
    };

    const submitPersona = async (finalAnswers: Answer) => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch("/api/persona/onboard", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(finalAnswers),
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.detail || "Classification failed.");
            }
            const data = await res.json();
            // Redirect to dashboard with the archetype shown
            router.push(`/dashboard?persona=${data.archetype}`);
        } catch (e: any) {
            setError(e.message || "Something went wrong. Please try again.");
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-900 to-slate-900 flex items-center justify-center">
                <div className="text-center space-y-6 animate-pulse">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 mx-auto flex items-center justify-center text-4xl shadow-2xl">
                        🧠
                    </div>
                    <h2 className="text-2xl font-bold text-white">Building your Digital Twin…</h2>
                    <p className="text-indigo-300 text-sm">Personalising your AI mentor, nudge schedule, and opportunity feed.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-900 to-slate-900 flex items-center justify-center p-4">
            <div className="w-full max-w-2xl">

                {/* Progress Bar */}
                <div className="mb-8">
                    <div className="flex justify-between text-xs text-indigo-300 mb-2">
                        <span>Question {step + 1} of {STEPS.length}</span>
                        <span>{progress}% complete</span>
                    </div>
                    <div className="h-2 bg-indigo-900/60 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-violet-500 to-indigo-400 rounded-full transition-all duration-500"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>

                {/* Card */}
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
                    <div className="text-center mb-8">
                        <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
                            {current.question}
                        </h1>
                        <p className="text-indigo-300 text-sm">{current.subtitle}</p>
                    </div>

                    <div className="space-y-3">
                        {current.options.map((opt) => (
                            <button
                                key={opt.value}
                                onClick={() => handleSelect(opt.value)}
                                className="w-full text-left group p-4 rounded-2xl border border-white/10 hover:border-violet-400/60 hover:bg-violet-500/10 transition-all duration-200 flex items-center gap-4"
                            >
                                <div className="flex-1">
                                    <p className="text-white font-semibold group-hover:text-violet-200 transition-colors">
                                        {opt.label}
                                    </p>
                                    <p className="text-indigo-400 text-xs mt-0.5">{opt.desc}</p>
                                </div>
                                <div className="w-5 h-5 rounded-full border border-white/20 group-hover:border-violet-400 group-hover:bg-violet-500/20 transition-all flex-shrink-0" />
                            </button>
                        ))}
                    </div>

                    {/* Back button */}
                    {step > 0 && (
                        <button
                            onClick={() => setStep(step - 1)}
                            className="mt-6 text-indigo-400 hover:text-indigo-200 text-sm flex items-center gap-1 transition-colors"
                        >
                            ← Back
                        </button>
                    )}

                    {error && (
                        <p className="mt-4 text-red-400 text-sm text-center bg-red-500/10 rounded-xl p-3">
                            {error}
                        </p>
                    )}
                </div>

                {/* Footer */}
                <p className="text-center text-indigo-500 text-xs mt-6">
                    ✦ Your answers are private and can be updated anytime from Settings.
                </p>
            </div>
        </div>
    );
}
