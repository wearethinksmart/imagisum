"use client";
import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "imagisum:recent-searches";
const EVENT = "imagisum:recent-searches-changed";
const MAX = 8;

function read(): string[] {
    if (typeof window === "undefined") return [];
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        const parsed: unknown = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === "string") : [];
    } catch {
        return [];
    }
}

export function useRecentSearches() {
    const [recent, setRecent] = useState<string[]>([]);

    useEffect(() => {
        setRecent(read());
        const sync = () => setRecent(read());
        window.addEventListener(EVENT, sync);
        return () => window.removeEventListener(EVENT, sync);
    }, []);

    const push = useCallback((term: string) => {
        const value = term.trim();
        if (!value) return;

        const next = [value, ...read().filter((v) => v.toLowerCase() !== value.toLowerCase())].slice(0, MAX);
        try {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch {
            /* ignore — history is a convenience */
        }
        window.dispatchEvent(new CustomEvent(EVENT));
    }, []);

    const clear = useCallback(() => {
        try {
            window.localStorage.removeItem(STORAGE_KEY);
        } catch {
            /* ignore */
        }
        window.dispatchEvent(new CustomEvent(EVENT));
    }, []);

    return { recent, push, clear };
}
