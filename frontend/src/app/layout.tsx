import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const font = Plus_Jakarta_Sans({
    subsets: ["latin"],
    weight: ["400", "500", "600", "700", "800"],
    variable: "--font-sans",
});

export const metadata: Metadata = {
    title: "SARGVISION AI — Your AI Career Co-Pilot",
    description:
        "Hyper-personalized AI career co-pilot for Indian students. Track your academic journey, build your Digital Twin, and get guided to the right career path.",
    keywords: ["career guidance", "Indian students", "AI mentor", "EdTech", "UPSC", "NEET", "placement"],
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" className={font.variable}>
            <body className="bg-surface font-sans antialiased">{children}</body>
        </html>
    );
}
