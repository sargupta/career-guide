"use client";

import { Mic, Waves } from "lucide-react";
import { useState } from "react";

interface VoiceTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    onVoiceResult?: (text: string) => void;
}

export function VoiceTextarea({ className, onVoiceResult, ...props }: VoiceTextareaProps) {
    const [isListening, setIsListening] = useState(false);

    const handleMicClick = () => {
        setIsListening(!isListening);
        if (!isListening && onVoiceResult) {
            // Mocking transcription delay
            setTimeout(() => {
                onVoiceResult("I want to build software that impacts millions of users, eventually moving into product management.");
                setIsListening(false);
            }, 3000);
        }
    };

    return (
        <div className="relative w-full">
            <textarea
                className={`w-full px-4 py-3 rounded-xl border ${isListening ? 'border-primary ring-1 ring-primary/30' : 'border-slate-200'} bg-white/80 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition min-h-[120px] pb-10 ${className || ''}`}
                {...props}
            />
            <div className="absolute bottom-3 right-3 flex items-center">
                {isListening && <span className="text-primary text-xs font-medium mr-2 animate-pulse">Listening...</span>}
                <button
                    type="button"
                    onClick={handleMicClick}
                    title="Speak your answer"
                    className={`transition-all duration-300 ${isListening
                            ? "text-white bg-primary p-2 rounded-full shadow-[0_0_10px_rgba(13,148,136,0.6)] animate-pulse"
                            : "text-primary hover:text-primary/80 bg-slate-50 p-2 rounded-full"
                        }`}
                >
                    {isListening ? <Waves className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>
            </div>
        </div>
    );
}
