"use client";
import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Mic, Eye, EyeOff, Loader2 } from "lucide-react";

export default function SignupPage() {
    const [showPassword, setShowPassword] = useState(false);
    const [tab, setTab] = useState<"signup" | "login">("signup");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [fullName, setFullName] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const supabase = createClient();

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (tab === "signup") {
                const { error: signUpError } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            full_name: fullName,
                        },
                        emailRedirectTo: `${window.location.origin}/auth/callback`
                    }
                });

                if (signUpError) throw signUpError;

                // Typically, after signup we send them to onboarding if email confirmation is off,
                // or tell them to check email if it's on. Assuming Auto-Confirm is ON or they can proceed:
                router.push("/onboarding");

            } else {
                const { error: signInError } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });

                if (signInError) throw signInError;

                router.push("/dashboard");
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };


    return (
        <main className="min-h-screen bg-surface flex flex-col items-center justify-center px-4">
            <div className="fixed inset-0 bg-hero-gradient pointer-events-none" />

            {/* Logo */}
            <Link href="/" className="mb-8 text-2xl font-extrabold text-primary tracking-tight">
                SARGVISION<span className="text-accent"> AI</span>
            </Link>
            <p className="text-slate-500 text-sm mb-8 -mt-4">Your AI Career Co-Pilot</p>

            {/* Card */}
            <div className="glass w-full max-w-md p-8 relative z-10">
                {/* Tab switcher */}
                <div className="flex mb-8 border-b border-slate-100">
                    {(["signup", "login"] as const).map((t) => (
                        <button
                            key={t}
                            type="button"
                            onClick={() => { setTab(t); setError(null); }}
                            className={`flex-1 pb-3 text-sm font-semibold capitalize transition-colors ${tab === t
                                ? "text-primary border-b-2 border-primary -mb-px"
                                : "text-slate-400 hover:text-slate-600"
                                }`}
                        >
                            {t === "signup" ? "Sign Up" : "Log In"}
                        </button>
                    ))}
                </div>

                {error && (
                    <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-600 border border-red-100 text-sm">
                        {error}
                    </div>
                )}

                <form className="space-y-4" onSubmit={handleAuth}>
                    {tab === "signup" && (
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1">Full Name</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    required
                                    placeholder="Arjun Sharma"
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white/80 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition pr-10"
                                />
                                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-primary hover:text-primary/80 transition-colors">
                                    <Mic className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Email Address</label>
                        <div className="relative">
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                placeholder="arjun@example.com"
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white/80 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition pr-10"
                            />
                            <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-primary hover:text-primary/80 transition-colors">
                                <Mic className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Password</label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                placeholder={tab === "signup" ? "Create a strong password" : "Enter your password"}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white/80 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition pr-20"
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                                <button type="button" className="text-primary hover:text-primary/80 transition-colors">
                                    <Mic className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {tab === "login" && (
                        <div className="flex justify-end">
                            <a href="#" className="text-xs text-primary hover:underline">Forgot password?</a>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-primary w-full mt-2 flex justify-center items-center gap-2"
                    >
                        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                        {tab === "signup" ? "Create Account" : "Log In"}
                    </button>

                    {tab === "signup" && (
                        <p className="text-xs text-slate-400 text-center mt-4">
                            By signing up, you agree to our{" "}
                            <a href="#" className="text-primary hover:underline">Terms</a> and{" "}
                            <a href="#" className="text-primary hover:underline">Privacy Policy</a>
                        </p>
                    )}

                    <p className="text-sm text-center text-slate-500 mt-2">
                        {tab === "signup" ? (
                            <>Already have an account? <button type="button" onClick={() => { setTab("login"); setError(null); }} className="text-primary font-semibold hover:underline">Log in</button></>
                        ) : (
                            <>Don't have an account? <button type="button" onClick={() => { setTab("signup"); setError(null); }} className="text-primary font-semibold hover:underline">Sign up free</button></>
                        )}
                    </p>
                </form>
            </div>
        </main>
    );
}
