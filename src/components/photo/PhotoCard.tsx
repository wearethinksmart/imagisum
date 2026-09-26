"use client";
import { useState } from "react";
import { IconArrowDownToArc, IconPhoto } from "@tabler/icons-react";
import { twMerge } from "tailwind-merge";

import PhotoDialog from "./PhotoDialog";
import { Photo } from "@/_types";

interface Props {
    item: Photo;
    /** Set on the first screenful so the LCP image isn't lazy loaded. */
    priority?: boolean;
    className?: string;
}

const PhotoCard = ({ item, priority, className }: Props) => {
    const [open, setOpen] = useState(false);
    // Kept mounted after the first open so the dialog can animate out.
    const [mounted, setMounted] = useState(false);

    const openDialog = () => {
        setMounted(true);
        setOpen(true);
    };

    return (
        <>
            <article
                className={twMerge(
                    "group relative mb-4 break-inside-avoid overflow-hidden rounded-2xl bg-bg-inset",
                    className
                )}
            >
                <button
                    type="button"
                    onClick={openDialog}
                    className="block w-full text-left focus-visible:outline-none"
                    aria-label={`${item.alt} — download`}
                >
                    <span className="block w-full" style={{ backgroundColor: item.color ?? undefined }}>
                        {/* Already sized by the provider's CDN — no optimiser in between. */}
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={item.thumb}
                            alt={item.alt}
                            width={item.width}
                            height={item.height}
                            loading={priority ? "eager" : "lazy"}
                            fetchPriority={priority ? "high" : undefined}
                            className="h-auto w-full transition-transform duration-500 group-hover:scale-[1.03]"
                        />
                    </span>

                    <span className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/75 via-black/10 to-black/25 opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
                </button>

                {/* Outside the button, so the credit links are real, separately
                    clickable links — Unsplash requires both to be linked. */}
                <div className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-2 p-4 opacity-0 transition-all duration-200 focus-within:translate-y-0 focus-within:opacity-100 group-hover:translate-y-0 group-hover:opacity-100">
                    <p className="truncate text-label text-white/80">
                        Photo by{" "}
                        <a
                            href={item.photographerUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="pointer-events-auto font-semibold text-white hover:underline"
                        >
                            {item.photographer}
                        </a>{" "}
                        on{" "}
                        <a
                            href={item.pageUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="pointer-events-auto font-semibold text-white hover:underline"
                        >
                            Unsplash
                        </a>
                    </p>
                    <p className="mt-0.5 flex items-center gap-1.5 text-meta font-medium text-white/75">
                        <IconPhoto size={13} />
                        {item.width} × {item.height}
                    </p>
                </div>

                <button
                    type="button"
                    onClick={openDialog}
                    aria-label="Download"
                    className="absolute right-3 top-3 inline-flex h-9 translate-y-2 items-center gap-1.5 rounded-xl bg-brand px-3 text-label font-semibold text-brand-fg opacity-0 shadow-sm transition-all duration-200 hover:scale-105 focus-visible:translate-y-0 focus-visible:opacity-100 active:scale-95 group-hover:translate-y-0 group-hover:opacity-100"
                >
                    <IconArrowDownToArc size={16} />
                    Get
                </button>
            </article>

            {mounted && <PhotoDialog open={open} onClose={() => setOpen(false)} photo={item} />}
        </>
    );
};

export default PhotoCard;
