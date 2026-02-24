"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Send, Sparkles, User, FileText } from "lucide-react";
import { VoiceInput } from "@/components/ui/VoiceInput";
import { apiFetch } from "@/lib/api";

interface Message {
    id: string;
    role: "ai" | "user";
    text: string;
}

const initialMessages: Message[] = [
    {
        id: "1",
        role: "ai",
        text: "Hi there! I am your SARGVISION AI Mentor. I've reviewed your digital twin and career aspirations.",
    },
    {
        id: "2",
        role: "ai",
        text: "Here is a structured plan for you, Arjun:\n1. Create a Product Case Study centered on a consumer app.\n2. Log your recent Hackathon experience specifically highlighting leadership.\n3. Take the PM 101 Course on SARGVISION.\n\nI'd be happy to review it. Please upload your latest resume in PDF format so I can analyze it against PM role requirements.",
    }
];

export default function MentorChatPage() {
    const [messages, setMessages] = useState<Message[]>(initialMessages);
    const [inputValue, setInputValue] = useState("");

    const [isTyping, setIsTyping] = useState(false);

    const handleSend = async () => {
        if (!inputValue.trim()) return;

        const userText = inputValue.trim();
        const newUserMsg: Message = { id: Date.now().toString(), role: "user", text: userText };
        setMessages(prev => [...prev, newUserMsg]);
        setInputValue("");
        setIsTyping(true);

        try {
            // Call the FastAPI backend directly using the authenticated apiFetch client
            const data = await apiFetch("/mentor/chat", {
                method: "POST",
                body: JSON.stringify({ message: userText }),
            });

            const aiMsg: Message = {
                id: Date.now().toString(),
                role: "ai",
                text: data.reply || "I didn't get a response. Try again?",
            };
            setMessages(prev => [...prev, aiMsg]);
        } catch (error) {
            console.error("Chat error:", error);
            const errorMsg: Message = {
                id: Date.now().toString(),
                role: "ai",
                text: "My backend connection seems to be down. Are the Python services running?",
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsTyping(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            handleSend();
        }
    };

    const handleVoiceResult = (text: string) => {
        setInputValue(text);
    };

    return (
        <main className="min-h-screen bg-surface flex flex-col items-center">
            {/* Background */}
            <div className="fixed inset-0 bg-hero-gradient pointer-events-none" />

            <div className="w-full max-w-2xl flex flex-col h-screen relative z-10">

                {/* Header */}
                <header className="glass m-4 p-4 rounded-2xl flex items-center justify-between sticky top-4 z-20">
                    <div className="flex items-center gap-3">
                        <Link href="/digital-twin" className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-500">
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <div>
                            <h1 className="font-bold border-b-0 text-slate-800 flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-primary" />
                                AI Mentor
                            </h1>
                            <p className="text-xs text-slate-500">Personalized for your journey</p>
                        </div>
                    </div>
                </header>

                {/* Chat Area */}
                <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
                    {messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2`}
                        >
                            <div className={`flex max-w-[85%] gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>

                                {/* Avatar */}
                                <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center shadow-sm
                                    ${msg.role === "ai" ? "bg-primary/10 text-primary" : "bg-slate-800 text-white"}`}
                                >
                                    {msg.role === "ai" ? <Sparkles className="w-4 h-4" /> : <User className="w-4 h-4" />}
                                </div>

                                {/* Bubble */}
                                <div className={`px-5 py-3.5 rounded-2xl text-sm leading-relaxed shadow-sm
                                    ${msg.role === "user"
                                        ? "bg-slate-800 text-white rounded-tr-sm"
                                        : "glass bg-white/70 text-slate-700 rounded-tl-sm border border-white/40"
                                    }`}
                                >
                                    {msg.text.split('\n').map((line, i) => (
                                        <p key={i} className={i > 0 ? "mt-2" : ""}>{line}</p>
                                    ))}

                                    {/* Mock attachment for the resume request */}
                                    {msg.id === "2" && (
                                        <button className="mt-4 flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-xl hover:bg-primary/20 transition-colors w-full border border-primary/20">
                                            <FileText className="w-4 h-4" />
                                            <span className="font-medium text-xs">Upload Resume (PDF)</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Input Area */}
                <div className="p-4 bg-gradient-to-t from-surface via-surface to-transparent">
                    <div className="glass rounded-2xl p-2 flex items-center gap-2 shadow-sm border border-slate-200/60 max-w-2xl mx-auto">
                        <VoiceInput
                            placeholder="Ask me anything..."
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            onVoiceResult={handleVoiceResult}
                            className="border-none shadow-none bg-transparent focus:ring-0 py-2"
                        />
                        <button
                            onClick={handleSend}
                            disabled={!inputValue.trim()}
                            className="bg-primary hover:bg-primary/90 disabled:bg-slate-200 disabled:text-slate-400 text-white p-2.5 rounded-xl transition-colors flex-shrink-0"
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </div>
                    <p className="text-center text-[10px] text-slate-400 mt-3 font-medium">
                        SARGVISION AI can make mistakes. Consider verifying important information.
                    </p>
                </div>
            </div>
        </main>
    );
}
