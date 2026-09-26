import Link from "next/link";
import { twMerge } from "tailwind-merge";

interface Props {
    className?: string;
    /** Inverted styling for the transparent header over the hero image. */
    onDark?: boolean;
}

/** The home button — always routes back to `/`. */
const Logo = ({ className, onDark }: Props) => (
    <Link
        href="/"
        aria-label="Imagisum — go to home"
        className={twMerge("group flex shrink-0 items-center gap-2.5", className)}
    >
        <span className="relative inline-flex size-9 items-center justify-center overflow-hidden rounded-xl bg-brand text-brand-fg transition-transform duration-200 group-hover:scale-105">
            <svg viewBox="0 0 24 24" fill="none" className="size-5" aria-hidden="true">
                <path
                    d="M4 17.5 9.2 11l3.4 4.2 2.5-2.9L20 17.5"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                <circle cx="15.6" cy="8" r="1.7" fill="currentColor" />
                <rect x="3" y="4.5" width="18" height="15" rx="3.5" stroke="currentColor" strokeWidth="1.8" />
            </svg>
        </span>
        <span
            className={twMerge(
                "text-lg font-semibold tracking-tight transition-colors",
                onDark ? "text-white" : "text-fg"
            )}
        >
            Imagisum
        </span>
    </Link>
);

export default Logo;
