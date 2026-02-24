"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export function Step5TwinInit() {
    const [progress, setProgress] = useState(0);
    const router = useRouter();

    useEffect(() => {
        // Simulate the Digital Twin initialization sequence
        const interval = setInterval(() => {
            setProgress(p => {
                if (p >= 100) {
                    clearInterval(interval);
                    setTimeout(() => router.push("/digital-twin"), 500);
                    return 100;
                }
                return p + 2;
            });
        }, 40);

        return () => clearInterval(interval);
    }, [router]);

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 py-10 flex flex-col items-center justify-center text-center">
            <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-8 relative">
                <div className="absolute inset-0 rounded-full border-4 border-slate-100" />
                <svg
                    className="absolute inset-0 w-full h-full text-primary -rotate-90"
                    viewBox="0 0 100 100"
                >
                    <circle
                        cx="50"
                        cy="50"
                        r="48"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="4"
                        strokeDasharray="301"
                        strokeDashoffset={301 - (301 * progress) / 100}
                        className="transition-all duration-75 ease-linear"
                    />
                </svg>
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>

            <h1 className="text-2xl font-bold text-slate-900 mb-2">Creating your Digital Twin</h1>
            <p className="text-slate-500 max-w-xs mx-auto">
                {progress < 30 && "Connecting your academic path..."}
                {progress >= 30 && progress < 70 && "Analyzing your career aspirations..."}
                {progress >= 70 && progress < 100 && "Mapping skills and readiness..."}
                {progress === 100 && "Ready to launch!"}
            </p>
        </div>
    );
}
