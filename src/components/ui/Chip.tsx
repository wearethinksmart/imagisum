import Link from "next/link";
import { ReactNode } from "react";
import { twMerge } from "tailwind-merge";

interface Props {
    href: string;
    children: ReactNode;
    active?: boolean;
    className?: string;
    prefetch?: boolean;
}

/** Pill-shaped navigation link used for categories and quick searches. */
const Chip = ({ href, children, active, className, prefetch = false }: Props) => (
    <Link
        href={href}
        prefetch={prefetch}
        className={twMerge(
            "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition-colors duration-150",
            active
                ? "border-fg bg-fg text-bg"
                : "border-border bg-bg-elevated text-fg-muted hover:border-border-strong hover:text-fg",
            className
        )}
    >
        {children}
    </Link>
);

export default Chip;
