"use client";
import { useState } from "react";
import { IconCheck, IconCopy } from "@tabler/icons-react";
import { twMerge } from "tailwind-merge";

interface Props {
    code: string;
    className?: string;
}

const CodeBlock = ({ code, className }: Props) => {
    const [copied, setCopied] = useState(false);

    const copy = async () => {
        try {
            await navigator.clipboard.writeText(code);
            setCopied(true);
            setTimeout(() => setCopied(false), 1800);
        } catch {
            /* clipboard unavailable — the text is still selectable */
        }
    };

    return (
        <div className={twMerge("group relative overflow-hidden rounded-2xl border border-border bg-bg-subtle", className)}>
            <button
                type="button"
                onClick={copy}
                aria-label="Copy code"
                className="absolute right-2.5 top-2.5 inline-flex items-center gap-1.5 rounded-lg border border-border bg-bg-elevated px-2.5 py-1.5 text-xs font-medium text-fg-muted opacity-0 transition-all hover:text-fg focus-visible:opacity-100 group-hover:opacity-100"
            >
                {copied ? <IconCheck size={14} className="text-emerald-500" /> : <IconCopy size={14} />}
                {copied ? "Copied" : "Copy"}
            </button>
            <pre className="overflow-x-auto p-5 font-mono text-[13px] leading-relaxed text-fg-muted">
                <code>{code}</code>
            </pre>
        </div>
    );
};

export default CodeBlock;
