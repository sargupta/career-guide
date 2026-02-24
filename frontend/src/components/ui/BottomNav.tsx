"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, BrainCircuit, Sparkles, CalendarDays, Compass } from "lucide-react";

const navItems = [
    { href: "/dashboard", icon: Home, label: "Home" },
    { href: "/digital-twin", icon: BrainCircuit, label: "Twin" },
    { href: "/mentor", icon: Sparkles, label: "Mentor" },
    { href: "/timeline", icon: CalendarDays, label: "Timeline" },
    { href: "/opportunities", icon: Compass, label: "Radar" },
];

export function BottomNav() {
    const pathname = usePathname();

    return (
        <nav className="fixed bottom-0 left-0 right-0 glass border-t border-white/40 z-50">
            <div className="max-w-2xl mx-auto px-6 py-2 flex justify-around items-center">
                {navItems.map(({ href, icon: Icon, label }) => {
                    const active = pathname === href;
                    return (
                        <Link
                            key={href}
                            href={href}
                            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${active ? "text-primary" : "text-slate-400 hover:text-slate-600"
                                }`}
                        >
                            <Icon className={`w-5 h-5 ${active ? "stroke-primary" : ""}`} />
                            <span className={`text-[10px] font-semibold ${active ? "text-primary" : ""}`}>
                                {label}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
