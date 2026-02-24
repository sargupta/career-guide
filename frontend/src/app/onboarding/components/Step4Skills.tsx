"use client";

import { useState } from "react";

const MOCK_SKILLS = [
    "Python", "JavaScript", "React", "Node.js", "SQL",
    "Project Management", "Communication", "Data Analysis", "Agile", "UI/UX"
];

export function Step4Skills({ onNext }: { onNext: () => void }) {
    const [selectedSkills, setSelectedSkills] = useState<string[]>([]);

    const toggleSkill = (skill: string) => {
        if (selectedSkills.includes(skill)) {
            setSelectedSkills(selectedSkills.filter(s => s !== skill));
        } else {
            setSelectedSkills([...selectedSkills, skill]);
        }
    };

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h1 className="text-2xl font-bold text-slate-900 mb-2">What skills do you already have?</h1>
            <p className="text-slate-500 mb-8">Select any skills or tools you are confident in. (Optional)</p>

            <div className="flex flex-wrap gap-2 mb-10">
                {MOCK_SKILLS.map((skill) => {
                    const isSelected = selectedSkills.includes(skill);
                    return (
                        <button
                            key={skill}
                            onClick={() => toggleSkill(skill)}
                            className={`px-4 py-2 rounded-full border text-sm font-medium transition-all ${isSelected
                                ? "border-primary bg-primary/10 text-primary"
                                : "border-slate-200 text-slate-600 bg-white hover:border-slate-300"}`}
                        >
                            {skill}
                        </button>
                    );
                })}
            </div>

            <div className="flex flex-col gap-3">
                <button
                    onClick={onNext}
                    className="btn-primary w-full shadow-lg"
                >
                    {selectedSkills.length > 0 ? "Continue →" : "Skip for now →"}
                </button>
            </div>
        </div>
    );
}
