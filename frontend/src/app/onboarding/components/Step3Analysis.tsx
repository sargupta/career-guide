"use client";

import { useState } from "react";
import { VoiceTextarea } from "@/components/ui/VoiceTextarea";
import { Loader2 } from "lucide-react";
import { apiFetch } from "@/lib/api";

const MOCK_PATHS = ["Software Engineer", "Product Manager", "Data Scientist"];

export function Step3Analysis({ onNext }: { onNext: () => void }) {
    const [aspirations, setAspirations] = useState("");
    const [analyzing, setAnalyzing] = useState(false);
    const [suggestedPaths, setSuggestedPaths] = useState<string[]>([]);
    const [selectedPaths, setSelectedPaths] = useState<string[]>([]);
    const [saving, setSaving] = useState(false);

    const handleAnalyze = () => {
        if (!aspirations) return;
        setAnalyzing(true);
        // Mock API call to LLM analysis
        setTimeout(() => {
            setSuggestedPaths(MOCK_PATHS);
            setAnalyzing(false);
        }, 2000);
    };

    const togglePath = (path: string) => {
        if (selectedPaths.includes(path)) {
            setSelectedPaths(selectedPaths.filter(p => p !== path));
        } else {
            if (selectedPaths.length < 3) {
                setSelectedPaths([...selectedPaths, path]);
            }
        }
    };

    const handleSubmit = async () => {
        setSaving(true);
        try {
            await apiFetch("/users/me/aspirations", {
                method: "PUT",
                body: JSON.stringify({ career_paths: selectedPaths }),
            });
            onNext();
        } catch (error) {
            console.error("Failed to save aspirations:", error);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h1 className="text-2xl font-bold text-slate-900 mb-2">What are your aspirations?</h1>
            <p className="text-slate-500 mb-6">Describe your ideal career, what you love doing, or roles you admire. Be as detailed as you like.</p>

            <VoiceTextarea
                placeholder="E.g., I want to build consumer apps and eventually move into product management. I enjoy coding but also talking to users..."
                value={aspirations}
                onChange={(e) => setAspirations(e.target.value)}
                onVoiceResult={(text) => setAspirations((prev) => prev ? `${prev} ${text}` : text)}
            />

            {suggestedPaths.length === 0 ? (
                <button
                    onClick={handleAnalyze}
                    disabled={!aspirations || analyzing}
                    className="w-full mt-6 py-3 px-4 rounded-xl border border-primary text-primary font-semibold hover:bg-primary/5 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                    {analyzing ? <Loader2 className="w-5 h-5 animate-spin" /> : "✨ Analyze Profile"}
                </button>
            ) : (
                <div className="mt-8 animate-in fade-in slide-in-from-bottom-2">
                    <h3 className="text-sm font-semibold text-slate-700 mb-3">Suggested Paths (Select up to 3)</h3>
                    <div className="flex flex-wrap gap-2 mb-8">
                        {suggestedPaths.map(path => {
                            const isSelected = selectedPaths.includes(path);
                            return (
                                <button
                                    key={path}
                                    onClick={() => togglePath(path)}
                                    className={`px-4 py-2 rounded-full border text-sm font-medium transition-all ${isSelected
                                        ? "border-primary bg-primary text-white shadow-md"
                                        : "border-slate-200 text-slate-600 bg-white/50 hover:border-primary/50"}`}
                                >
                                    {path}
                                </button>
                            );
                        })}
                    </div>
                    <button
                        onClick={handleSubmit}
                        disabled={saving}
                        className="btn-primary w-full flex items-center justify-center gap-2"
                    >
                        {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                        Continue →
                    </button>
                </div>
            )}
        </div>
    );
}
