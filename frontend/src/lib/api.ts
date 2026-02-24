import { createClient } from "./supabase/client";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

/**
 * A centralized API client for communicating with the FastAPI backend.
 * Automatically attaches the Supabase JWT token from the current session.
 */
export async function apiFetch(endpoint: string, options: RequestInit = {}) {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();

    const headers = new Headers(options.headers);
    headers.set("Content-Type", "application/json");

    if (session?.access_token) {
        headers.set("Authorization", `Bearer ${session.access_token}`);
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.detail || `API Error: ${response.statusText}`);
    }

    return response.json();
}
export const mentorApi = {
    chat: (message: string) => apiFetch("/mentor/chat", {
        method: "POST",
        body: JSON.stringify({ message }),
    }),
    getMemories: () => apiFetch("/mentor/memories"),
    deleteMemories: () => apiFetch("/mentor/memories", { method: "DELETE" }),
    deleteMemory: (id: string) => apiFetch(`/mentor/memories/${id}`, { method: "DELETE" }),
};

export const readinessApi = {
    getScore: () => apiFetch("/readiness"),
    refresh: () => apiFetch("/readiness", { method: "POST" }),
    getGaps: () => apiFetch("/readiness/memory-gaps"),
};

export const gamificationApi = {
    getProfile: () => apiFetch("/gamification/profile"),
};

export const portfolioApi = {
    getSummary: () => apiFetch("/portfolio/summary"),
    synthesize: () => apiFetch("/portfolio/synthesize", { method: "POST" }),
    togglePublic: (isPublic: boolean) => apiFetch("/portfolio/toggle-public", {
        method: "POST",
        body: JSON.stringify(isPublic),
    }),
    updateTheme: (theme: string) => apiFetch("/portfolio/theme", {
        method: "POST",
        body: JSON.stringify(theme),
    }),
};
