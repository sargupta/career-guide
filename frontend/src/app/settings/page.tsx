"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, MessageCircle, Bell, Bot, Phone, Check, AlertCircle, Languages } from "lucide-react";
import { BottomNav } from "@/components/ui/BottomNav";

type SaveStatus = "idle" | "saving" | "saved" | "error";

export default function SettingsPage() {
    const [phone, setPhone] = useState("");
    const [whatsappEnabled, setWhatsappEnabled] = useState(false);
    const [snapshots, setSnapshots] = useState(true);
    const [alerts, setAlerts] = useState(true);
    const [mentorBot, setMentorBot] = useState(true);
    const [preferredLanguage, setPreferredLanguage] = useState("English");
    const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");

    const handleSave = async () => {
        if (!phone.trim()) return;
        setSaveStatus("saving");

        try {
            const res = await fetch("/api/whatsapp/settings", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    whatsapp_phone: phone,
                    whatsapp_enabled: whatsappEnabled,
                    whatsapp_snapshots: snapshots,
                    whatsapp_alerts: alerts,
                    whatsapp_mentor: mentorBot,
                    preferred_language: preferredLanguage,
                }),
            });

            if (res.ok) {
                setSaveStatus("saved");
                setTimeout(() => setSaveStatus("idle"), 3000);
            } else {
                setSaveStatus("error");
            }
        } catch {
            setSaveStatus("error");
        }
    };

    return (
        <main className="min-h-screen bg-surface pb-24">
            <div className="fixed inset-0 bg-hero-gradient pointer-events-none" />

            <div className="max-w-2xl mx-auto px-4 relative z-10">
                {/* Header */}
                <header className="sticky top-0 z-40 glass border-b border-white/40 -mx-4 px-4 py-4 mb-6">
                    <div className="flex items-center gap-3">
                        <Link href="/dashboard" className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors text-slate-500">
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <div>
                            <h1 className="font-bold text-slate-800">Settings</h1>
                            <p className="text-xs text-slate-400">Notifications & Integrations</p>
                        </div>
                    </div>
                </header>

                {/* App Preferences Section */}
                <section className="space-y-4 mb-8">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-xl bg-violet-100 flex items-center justify-center">
                            <Languages className="w-4 h-4 text-violet-600" />
                        </div>
                        <div>
                            <h2 className="font-bold text-slate-800 text-sm">App Preferences</h2>
                            <p className="text-xs text-slate-400">Language & display settings</p>
                        </div>
                    </div>

                    <div className="glass p-5 rounded-2xl">
                        <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Mentor Language</label>
                        <select
                            value={preferredLanguage}
                            onChange={(e) => setPreferredLanguage(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white/80 text-sm font-medium focus:outline-none focus:border-primary text-slate-700"
                        >
                            <option value="English">English</option>
                            <option value="Hinglish">Hinglish (Hindi + English)</option>
                            <option value="Hindi">Hindi (हिंदी)</option>
                            <option value="Bengali">Bengali (বাংলা)</option>
                        </select>
                        <p className="text-xs text-slate-400 mt-2">
                            The AI Lead Mentor will automatically converse in your chosen language.
                        </p>
                    </div>
                </section>

                {/* WhatsApp Section */}
                <section className="space-y-4">
                    {/* Section Header */}
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center">
                            <MessageCircle className="w-4 h-4 text-emerald-600" />
                        </div>
                        <div>
                            <h2 className="font-bold text-slate-800 text-sm">WhatsApp Integration</h2>
                            <p className="text-xs text-slate-400">Get career updates on WhatsApp</p>
                        </div>
                    </div>

                    {/* Phone number card */}
                    <div className="glass p-5 rounded-2xl">
                        <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Phone Number</label>
                        <div className="flex gap-2">
                            <div className="flex items-center gap-2 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-500 flex-shrink-0">
                                <Phone className="w-4 h-4" />
                                +91
                            </div>
                            <input
                                type="tel"
                                placeholder="9876543210"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 bg-white/80 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition"
                            />
                        </div>
                        <p className="text-xs text-slate-400 mt-2">
                            Save the Twilio sandbox number <span className="font-semibold text-slate-600">+1 415 523 8886</span> and send{" "}
                            <span className="font-semibold font-mono text-primary">join &lt;code&gt;</span> to activate.
                        </p>
                    </div>

                    {/* Master toggle */}
                    <div className="glass p-5 rounded-2xl">
                        <Toggle
                            icon={<MessageCircle className="w-4 h-4 text-emerald-600" />}
                            iconBg="bg-emerald-100"
                            label="Enable WhatsApp Notifications"
                            description="Receive career updates on WhatsApp"
                            checked={whatsappEnabled}
                            onChange={setWhatsappEnabled}
                        />
                    </div>

                    {/* Individual toggles */}
                    <div className={`glass p-5 rounded-2xl space-y-5 transition-opacity ${whatsappEnabled ? "opacity-100" : "opacity-40 pointer-events-none"}`}>
                        <Toggle
                            icon={<Bell className="w-4 h-4 text-primary" />}
                            iconBg="bg-primary/10"
                            label="Weekly Career Snapshot"
                            description="Sunday 8 PM — readiness score, top match, mentor tip"
                            checked={snapshots}
                            onChange={setSnapshots}
                        />
                        <div className="border-t border-slate-100" />
                        <Toggle
                            icon={<Bell className="w-4 h-4 text-amber-500" />}
                            iconBg="bg-amber-50"
                            label="Deadline Alerts"
                            description="3 days before matched opportunities close"
                            checked={alerts}
                            onChange={setAlerts}
                        />
                        <div className="border-t border-slate-100" />
                        <Toggle
                            icon={<Bot className="w-4 h-4 text-violet-500" />}
                            iconBg="bg-violet-50"
                            label="AI Mentor on WhatsApp"
                            description="Chat with your mentor directly via WhatsApp"
                            checked={mentorBot}
                            onChange={setMentorBot}
                        />
                    </div>

                    {/* Save Button */}
                    <button
                        onClick={handleSave}
                        disabled={!phone.trim() || saveStatus === "saving"}
                        className={`w-full py-3.5 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${saveStatus === "saved"
                            ? "bg-emerald-500 text-white"
                            : saveStatus === "error"
                                ? "bg-red-500 text-white"
                                : "bg-primary hover:bg-primary/90 text-white disabled:bg-slate-200 disabled:text-slate-400"
                            }`}
                    >
                        {saveStatus === "saving" && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                        {saveStatus === "saved" && <Check className="w-4 h-4" />}
                        {saveStatus === "error" && <AlertCircle className="w-4 h-4" />}
                        {saveStatus === "idle" && "Save WhatsApp Settings"}
                        {saveStatus === "saving" && "Saving..."}
                        {saveStatus === "saved" && "Saved!"}
                        {saveStatus === "error" && "Failed — check phone number"}
                    </button>
                </section>
            </div>

            <BottomNav />
        </main>
    );
}

function Toggle({
    icon, iconBg, label, description, checked, onChange,
}: {
    icon: React.ReactNode;
    iconBg: string;
    label: string;
    description: string;
    checked: boolean;
    onChange: (v: boolean) => void;
}) {
    return (
        <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-xl ${iconBg} flex items-center justify-center flex-shrink-0`}>
                    {icon}
                </div>
                <div>
                    <p className="text-sm font-semibold text-slate-800">{label}</p>
                    <p className="text-xs text-slate-400">{description}</p>
                </div>
            </div>
            <button
                type="button"
                role="switch"
                aria-checked={checked}
                onClick={() => onChange(!checked)}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${checked ? "bg-primary" : "bg-slate-200"
                    }`}
            >
                <span
                    className={`inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${checked ? "translate-x-5" : "translate-x-0"
                        }`}
                />
            </button>
        </div>
    );
}
