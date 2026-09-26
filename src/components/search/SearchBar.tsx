"use client";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { IconSearch, IconX, IconHistory, IconTrendingUp, IconCornerDownLeft } from "@tabler/icons-react";
import { twMerge } from "tailwind-merge";

import { categories, popularSearches } from "@/lib/categories";
import { useRecentSearches } from "@/lib/use-recent-searches";

type Variant = "hero" | "header";

interface Suggestion {
    label: string;
    href: string;
    kind: "recent" | "category" | "popular";
}

interface Props {
    variant?: Variant;
    defaultValue?: string;
    placeholder?: string;
    className?: string;
    /** Registers the global "/" shortcut. Only one bar per page should own it. */
    globalShortcut?: boolean;
    autoFocus?: boolean;
}

const searchHref = (term: string) => `/search/${encodeURIComponent(term.trim())}`;

const SearchBar = ({
    variant = "header",
    defaultValue = "",
    placeholder = "Search for free photos",
    className,
    globalShortcut = false,
    autoFocus = false
}: Props) => {
    const router = useRouter();
    const { recent, push, clear } = useRecentSearches();

    const [value, setValue] = useState(defaultValue);
    const [open, setOpen] = useState(false);
    const [highlight, setHighlight] = useState(-1);

    const wrapRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Keep in sync when navigating between search pages.
    useEffect(() => setValue(defaultValue), [defaultValue]);

    const suggestions = useMemo<Suggestion[]>(() => {
        const term = value.trim().toLowerCase();

        if (!term) {
            return [
                ...recent.slice(0, 5).map((label) => ({ label, href: searchHref(label), kind: "recent" as const })),
                ...popularSearches
                    .filter((label) => !recent.some((r) => r.toLowerCase() === label.toLowerCase()))
                    .slice(0, 6)
                    .map((label) => ({ label, href: searchHref(label), kind: "popular" as const }))
            ];
        }

        const matchedCategories = categories
            .filter((category) => category.name.toLowerCase().includes(term))
            .slice(0, 4)
            .map((category) => ({
                label: category.name,
                href: `/discover/${category.slug}`,
                kind: "category" as const
            }));

        const matchedTerms = [...recent, ...popularSearches]
            .filter((label) => label.toLowerCase().includes(term) && label.toLowerCase() !== term)
            .slice(0, 5)
            .map((label) => ({ label, href: searchHref(label), kind: "popular" as const }));

        // De-dupe by label — a term can be both recent and popular.
        const seen = new Set<string>();
        return [...matchedCategories, ...matchedTerms].filter((item) => {
            const key = `${item.label.toLowerCase()}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    }, [value, recent]);

    // Close on outside click.
    useEffect(() => {
        if (!open) return;
        const onPointerDown = (event: MouseEvent) => {
            if (!wrapRef.current?.contains(event.target as Node)) setOpen(false);
        };
        document.addEventListener("mousedown", onPointerDown);
        return () => document.removeEventListener("mousedown", onPointerDown);
    }, [open]);

    // "/" focuses the search from anywhere on the page.
    useEffect(() => {
        if (!globalShortcut) return;
        const onKeyDown = (event: KeyboardEvent) => {
            const target = event.target as HTMLElement | null;
            const typing = target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName);
            if (event.key === "/" && !typing && !event.metaKey && !event.ctrlKey) {
                event.preventDefault();
                inputRef.current?.focus();
            }
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [globalShortcut]);

    const go = (term: string, href?: string) => {
        const trimmed = term.trim();
        if (!trimmed) return;
        push(trimmed);
        setOpen(false);
        setHighlight(-1);
        inputRef.current?.blur();
        router.push(href ?? searchHref(trimmed));
    };

    const onSubmit = (event: FormEvent) => {
        event.preventDefault();
        const picked = highlight >= 0 ? suggestions[highlight] : undefined;
        if (picked) return go(picked.label, picked.href);
        go(value);
    };

    const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === "Escape") {
            setOpen(false);
            setHighlight(-1);
            return;
        }
        if (!open || !suggestions.length) return;

        if (event.key === "ArrowDown") {
            event.preventDefault();
            setHighlight((prev) => (prev + 1) % suggestions.length);
        } else if (event.key === "ArrowUp") {
            event.preventDefault();
            setHighlight((prev) => (prev <= 0 ? suggestions.length - 1 : prev - 1));
        }
    };

    const isHero = variant === "hero";

    return (
        <div ref={wrapRef} className={twMerge("relative w-full", className)}>
            <form onSubmit={onSubmit} role="search">
                <div
                    className={twMerge(
                        "flex items-center gap-2 rounded-2xl border bg-bg-elevated transition-all duration-150",
                        isHero
                            ? "h-14 border-transparent px-4 shadow-xl shadow-black/10 focus-within:ring-2 focus-within:ring-brand md:h-16 md:px-5"
                            : "h-11 border-border px-3.5 focus-within:border-brand"
                    )}
                >
                    <IconSearch className="shrink-0 text-fg-subtle" size={isHero ? 22 : 19} />
                    <input
                        ref={inputRef}
                        type="search"
                        value={value}
                        autoFocus={autoFocus}
                        placeholder={placeholder}
                        aria-label="Search photos"
                        aria-expanded={open}
                        aria-autocomplete="list"
                        role="combobox"
                        aria-controls="search-suggestions"
                        onChange={(event) => {
                            setValue(event.target.value);
                            setOpen(true);
                            setHighlight(-1);
                        }}
                        onFocus={() => setOpen(true)}
                        onKeyDown={onKeyDown}
                        className={twMerge(
                            "min-w-0 flex-1 bg-transparent text-fg outline-none placeholder:text-fg-subtle [&::-webkit-search-cancel-button]:hidden",
                            isHero ? "text-base md:text-lg" : "text-sm"
                        )}
                    />
                    {value && (
                        <button
                            type="button"
                            aria-label="Clear search"
                            onClick={() => {
                                setValue("");
                                inputRef.current?.focus();
                            }}
                            className="shrink-0 rounded-full p-1 text-fg-subtle transition-colors hover:bg-bg-inset hover:text-fg"
                        >
                            <IconX size={16} />
                        </button>
                    )}
                    {isHero && (
                        <button
                            type="submit"
                            className="hidden h-10 shrink-0 items-center gap-2 rounded-xl bg-brand px-5 text-sm font-semibold text-brand-fg transition-colors hover:bg-brand-hover sm:inline-flex md:h-11"
                        >
                            Search
                        </button>
                    )}
                    {!isHero && !value && (
                        <kbd className="hidden shrink-0 rounded-md border border-border px-1.5 py-0.5 font-mono text-[11px] text-fg-subtle lg:block">
                            /
                        </kbd>
                    )}
                </div>
            </form>

            {open && suggestions.length > 0 && (
                <div
                    id="search-suggestions"
                    role="listbox"
                    className="absolute inset-x-0 top-[calc(100%+8px)] z-50 overflow-hidden rounded-2xl border border-border bg-bg-elevated p-2 shadow-2xl shadow-black/10 animate-fade-in"
                >
                    {!value.trim() && recent.length > 0 && (
                        <div className="flex items-center justify-between px-3 pb-1 pt-1.5">
                            <span className="text-[11px] font-semibold uppercase tracking-wider text-fg-subtle">
                                Recent
                            </span>
                            <button
                                type="button"
                                onClick={clear}
                                className="text-[11px] font-medium text-fg-subtle transition-colors hover:text-brand"
                            >
                                Clear
                            </button>
                        </div>
                    )}
                    <ul>
                        {suggestions.map((suggestion, index) => (
                            <li key={`${suggestion.kind}-${suggestion.label}`}>
                                <button
                                    type="button"
                                    role="option"
                                    aria-selected={highlight === index}
                                    onMouseEnter={() => setHighlight(index)}
                                    onClick={() => go(suggestion.label, suggestion.href)}
                                    className={twMerge(
                                        "group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors",
                                        highlight === index ? "bg-bg-inset text-fg" : "text-fg-muted"
                                    )}
                                >
                                    <span className="text-fg-subtle">
                                        {suggestion.kind === "recent" ? (
                                            <IconHistory size={17} />
                                        ) : suggestion.kind === "category" ? (
                                            <IconSearch size={17} />
                                        ) : (
                                            <IconTrendingUp size={17} />
                                        )}
                                    </span>
                                    <span className="flex-1 truncate font-medium">{suggestion.label}</span>
                                    {suggestion.kind === "category" && (
                                        <span className="rounded-md bg-brand-soft px-1.5 py-0.5 text-[11px] font-semibold text-brand">
                                            Category
                                        </span>
                                    )}
                                    {highlight === index && <IconCornerDownLeft size={15} className="text-fg-subtle" />}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default SearchBar;
