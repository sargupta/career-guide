import { Metadata } from "next";
import PortfolioClient from "./PortfolioClient";

interface PortfolioData {
    portfolio: {
        bio: string;
        highlights: { title: string; reason: string }[];
        profiles: {
            full_name: string;
            avatar_url: string | null;
            domains: { name: string };
        };
    };
    achievements: any[];
}

async function getPortfolioData(slug: string): Promise<PortfolioData | null> {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
    try {
        const res = await fetch(`${apiUrl}/portfolio/public/${slug}`, { next: { revalidate: 60 } });
        if (!res.ok) return null;
        return res.json();
    } catch (err) {
        return null;
    }
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
    const data = await getPortfolioData(params.slug);
    if (!data) return { title: "Portfolio Not Found | SARGVISION" };

    const { full_name, domains } = data.portfolio.profiles;
    const profession = domains?.name || "Professional";
    const title = `${full_name}'s Smart AI Portfolio | SARGVISION`;
    const description = `AI-Synthesized Career Highlights for ${full_name}, Future ${profession}. ${data.portfolio.bio.substring(0, 150)}...`;

    return {
        title,
        description,
        openGraph: {
            title,
            description,
            type: "profile",
            images: [
                {
                    url: data.portfolio.profiles.avatar_url || "/og-portfolio.png",
                    width: 1200,
                    height: 630,
                    alt: full_name,
                }
            ],
        },
        twitter: {
            card: "summary_large_image",
            title,
            description,
        }
    };
}

export default async function Page({ params }: { params: { slug: string } }) {
    const data = await getPortfolioData(params.slug);

    if (!data) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-surface p-6 text-center">
                <h1 className="text-2xl font-bold text-slate-800 mb-2">404 - Portfolio Not Found</h1>
                <p className="text-slate-500 max-w-md">The portfolio you are looking for does not exist or has been made private by the student.</p>
            </div>
        );
    }

    return <PortfolioClient data={data} slug={params.slug} />;
}
