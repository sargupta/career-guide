"use client";

import { useState } from "react";
import { Step1Academic } from "./components/Step1Academic";
import { Step2Domain } from "./components/Step2Domain";
import { Step3Analysis } from "./components/Step3Analysis";
import { Step4Skills } from "./components/Step4Skills";
import { Step5TwinInit } from "./components/Step5TwinInit";

export default function OnboardingPage() {
    const [currentStep, setCurrentStep] = useState(1);
    const totalSteps = 5;

    const handleNext = () => {
        if (currentStep < totalSteps) setCurrentStep(currentStep + 1);
    };

    const handleBack = () => {
        if (currentStep > 1) setCurrentStep(currentStep - 1);
    };

    // Calculate progress percentage
    const progress = (currentStep / totalSteps) * 100;

    return (
        <main className="min-h-screen bg-surface flex flex-col items-center pt-12 px-4 pb-24">
            <div className="fixed inset-0 bg-hero-gradient pointer-events-none" />

            <div className="w-full max-w-md relative z-10">
                {/* Progress Bar Header */}
                <div className="mb-8">
                    <div className="flex justify-between items-center mb-2">
                        <button
                            onClick={handleBack}
                            disabled={currentStep === 1}
                            className={`text-slate-500 hover:text-slate-800 transition ${currentStep === 1 ? 'opacity-0 cursor-default' : ''}`}
                        >
                            ← Back
                        </button>
                        <span className="text-sm font-semibold text-slate-500">
                            Step {currentStep}/{totalSteps}
                        </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-primary transition-all duration-500 ease-out"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>

                {/* Step Content Rendering */}
                <div className="glass p-6 md:p-8">
                    {currentStep === 1 && <Step1Academic onNext={handleNext} />}
                    {currentStep === 2 && <Step2Domain onNext={handleNext} />}
                    {currentStep === 3 && <Step3Analysis onNext={handleNext} />}
                    {currentStep === 4 && <Step4Skills onNext={handleNext} />}
                    {currentStep === 5 && <Step5TwinInit />}
                </div>
            </div>
        </main>
    );
}
