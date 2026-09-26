"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react";
import { twMerge } from "tailwind-merge";

import { categories } from "@/lib/categories";

interface Props {
    activeSlug?: string;
    className?: string;
}

/** Horizontally scrollable category strip, with arrows once it overflows. */
const CategoryRail = ({ activeSlug, className }: Props) => {
    const railRef = useRef<HTMLDivElement>(null);
    const [atStart, setAtStart] = useState(true);
    const [atEnd, setAtEnd] = useState(false);

    const sync = () => {
        const rail = railRef.current;
        if (!rail) return;
        setAtStart(rail.scrollLeft < 8);
        setAtEnd(rail.scrollLeft + rail.clientWidth >= rail.scrollWidth - 8);
    };

    useEffect(() => {
        sync();
        window.addEventListener("resize", sync);
        return () => window.removeEventListener("resize", sync);
    }, []);

    const scrollBy = (direction: 1 | -1) => {
        railRef.current?.scrollBy({ left: direction * 320, behavior: "smooth" });
    };

    return (
        <div className={twMerge("relative", className)}>
            <button
                type="button"
                aria-label="Scroll categories left"
                onClick={() => scrollBy(-1)}
                className={twMerge(
                    "absolute left-0 top-1/2 z-10 hidden size-9 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-bg-elevated shadow-md transition-opacity md:flex",
                    atStart && "pointer-events-none opacity-0"
                )}
            >
                <IconChevronLeft size={18} />
            </button>

            <div
                ref={railRef}
                onScroll={sync}
                className="no-scrollbar flex gap-2 overflow-x-auto scroll-smooth py-1 md:px-11"
            >
                <Link
                    href="/"
                    className={twMerge(
                        "inline-flex shrink-0 items-center rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                        !activeSlug
                            ? "border-fg bg-fg text-bg"
                            : "border-border bg-bg-elevated text-fg-muted hover:border-border-strong hover:text-fg"
                    )}
                >
                    All
                </Link>
                {categories.map((category) => (
                    <Link
                        key={category.slug}
                        href={`/discover/${category.slug}`}
                        className={twMerge(
                            "inline-flex shrink-0 items-center rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                            activeSlug === category.slug
                                ? "border-fg bg-fg text-bg"
                                : "border-border bg-bg-elevated text-fg-muted hover:border-border-strong hover:text-fg"
                        )}
                    >
                        {category.name}
                    </Link>
                ))}
            </div>

            <button
                type="button"
                aria-label="Scroll categories right"
                onClick={() => scrollBy(1)}
                className={twMerge(
                    "absolute right-0 top-1/2 z-10 hidden size-9 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-bg-elevated shadow-md transition-opacity md:flex",
                    atEnd && "pointer-events-none opacity-0"
                )}
            >
                <IconChevronRight size={18} />
            </button>
        </div>
    );
};

export default CategoryRail;
