import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ["Plus Jakarta Sans", "Inter", "system-ui", "sans-serif"],
            },
            colors: {
                primary: {
                    DEFAULT: "#059669",   // rich emerald
                    50: "#ECFDF5",
                    100: "#D1FAE5",
                    200: "#A7F3D0",
                    400: "#34D399",
                    500: "#10B981",
                    600: "#059669",
                    700: "#047857",
                    900: "#064E3B",
                },
                accent: {
                    DEFAULT: "#D97706",   // warm gold
                    50: "#FFFBEB",
                    100: "#FEF3C7",
                    200: "#FDE68A",
                    400: "#FBBF24",
                    500: "#F59E0B",
                    600: "#D97706",
                    700: "#B45309",
                },
                coral: "#F43F5E",        // keep for alerts / urgency
                surface: {
                    DEFAULT: "#F0FDF7",  // soft emerald tint
                    card: "rgba(255,255,255,0.72)",
                },
            },
            backgroundImage: {
                "glass-gradient": "linear-gradient(135deg, rgba(255,255,255,0.72) 0%, rgba(255,255,255,0.44) 100%)",
                "hero-gradient": "radial-gradient(ellipse at 60% 10%, rgba(5,150,105,0.10) 0%, rgba(217,119,6,0.05) 60%, transparent 80%)",
            },
            backdropBlur: {
                glass: "12px",
            },
            boxShadow: {
                glass: "0 4px 24px -4px rgba(0,0,0,0.07), 0 1px 4px rgba(0,0,0,0.04)",
                "glass-lg": "0 8px 40px -8px rgba(0,0,0,0.11), 0 2px 8px rgba(0,0,0,0.05)",
                "emerald": "0 4px 20px -4px rgba(5,150,105,0.25)",
                "gold": "0 4px 20px -4px rgba(217,119,6,0.20)",
            },
        },
    },
    plugins: [],
};
export default config;

