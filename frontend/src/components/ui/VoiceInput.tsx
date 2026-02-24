"use client";

import { Mic, Waves } from "lucide-react";
import { useState } from "react";

interface VoiceInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    onVoiceResult?: (text: string) => void;
}

export function VoiceInput({ className, onVoiceResult, ...props }: VoiceInputProps) {
    const [isListening, setIsListening] = useState(false);

    const handleMicClick = () => {
        // Note: Web Speech API integration goes here in Phase 5.
        // Currently functioning as a UI mockup toggle.
        setIsListening(!isListening);
        if (!isListening && onVoiceResult) {
            // Mocking a voice result payload for now
            setTimeout(() => {
                onVoiceResult("This is a transcribed voice input example...");
                setIsListening(false);
            }, 2000);
        }
    };

    return (
        <div className="relative w-full">
            <input
                className={`w-full px-4 py-3 rounded-xl border ${isListening ? 'border-primary ring-1 ring-primary/30' : 'border-slate-200'} bg-white/80 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition pr-12 ${className || ''}`}
                {...props}
            />
            <button
                type="button"
                onClick={handleMicClick}
                title="Dictate"
                className={`absolute right-3 top-1/2 -translate-y-1/2 transition-all duration-300 ${isListening
                        ? "text-white bg-primary p-1.5 rounded-full shadow-[0_0_10px_rgba(13,148,136,0.5)] animate-pulse"
                        : "text-primary hover:text-primary/80"
                    }`}
            >
                {isListening ? <Waves className="w-4 h-4 animate-bounce" /> : <Mic className="w-4 h-4" />}
            </button>
        </div>
    );
}
