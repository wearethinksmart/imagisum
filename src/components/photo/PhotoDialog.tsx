"use client";
import { useState } from "react";
import Link from "next/link";
import {
    IconAlertTriangle,
    IconCheck,
    IconCopy,
    IconDownload,
    IconExternalLink,
    IconLink,
    IconLock,
    IconLockOpen
} from "@tabler/icons-react";
import { twMerge } from "tailwind-merge";

import Dialog from "../ui/Dialog";
import Button from "../ui/Button";
import Spinner from "../ui/Spinner";
import CropPreview from "./CropPreview";
import { Photo } from "@/_types";
import { sizePresets } from "@/lib/image-url";
import { useImageTransform } from "@/lib/use-image-transform";
import { downloadPhoto } from "@/lib/download";

interface Props {
    open: boolean;
    onClose: () => void;
    photo: Photo;
}

const inputClass =
    "h-11 w-full rounded-xl border border-border bg-bg px-3 font-mono text-body outline-none transition-colors focus:border-brand";

/**
 * Pick a size, drag the crop, download. Nothing in here calls a photo API:
 * the preview is the listing's own image, and only the download itself goes
 * out to fetch pixels.
 */
const PhotoDialog = ({ open, onClose, photo }: Props) => {
    const t = useImageTransform(photo);

    const [copied, setCopied] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const [downloadError, setDownloadError] = useState<string | null>(null);

    const presets = sizePresets(photo);

    const copyUrl = async () => {
        try {
            await navigator.clipboard.writeText(t.fullUrl);
            setCopied(true);
            // Copying the link is using the photo, which Unsplash counts as a download.
            if (photo.source === "unsplash") {
                fetch(`/api/track?id=${encodeURIComponent(photo.id)}`, { method: "POST" }).catch(() => {});
            }
            setTimeout(() => setCopied(false), 1800);
        } catch {
            /* clipboard blocked — the field is selectable as a fallback */
        }
    };

    const onDownload = async () => {
        setDownloading(true);
        setDownloadError(null);
        try {
            await downloadPhoto(photo, t.transform);
        } catch (caught) {
            setDownloadError(caught instanceof Error ? caught.message : "The image could not be downloaded.");
        } finally {
            setDownloading(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} className="w-[calc(100%-1.5rem)] max-w-[980px]">
            <Dialog.Header title="Download" onClose={onClose} className="px-5 py-4" />
            <div className="border-b border-border" />

            <Dialog.Body className="px-5 py-5">
                <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,360px)] lg:gap-8">
                    <div>
                        <CropPreview
                            photo={photo}
                            width={t.width}
                            height={t.height}
                            focalX={t.focalX}
                            focalY={t.focalY}
                            onFocalChange={t.setFocal}
                        />

                        <p className="mt-3 flex flex-wrap items-center gap-x-1.5 text-body text-fg-muted">
                            Photo by
                            <Link
                                href={photo.photographerUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 font-medium text-brand hover:underline"
                            >
                                {photo.photographer}
                                <IconExternalLink size={15} />
                            </Link>
                            on
                            <Link href={photo.pageUrl} target="_blank" rel="noreferrer" className="font-medium hover:underline">
                                Unsplash
                            </Link>
                        </p>
                    </div>

                    <div className="space-y-6">
                        <section>
                            <h4 className="text-label font-semibold tracking-tight">Presets</h4>
                            <div className="mt-2.5 grid grid-cols-3 gap-2">
                                {presets.map((preset) => {
                                    const active = preset.width === t.width && preset.height === t.height;
                                    return (
                                        <button
                                            key={preset.label}
                                            type="button"
                                            onClick={() => t.applyPreset(preset.width, preset.height)}
                                            className={twMerge(
                                                "rounded-xl border px-2.5 py-2 text-left transition-colors",
                                                active
                                                    ? "border-brand bg-brand-soft text-brand"
                                                    : "border-border text-fg-muted hover:border-border-strong hover:text-fg"
                                            )}
                                        >
                                            <span className="block text-label font-semibold">{preset.label}</span>
                                            <span className="mt-0.5 block font-mono text-meta opacity-70">
                                                {preset.width}×{preset.height}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </section>

                        <section>
                            <div className="flex items-center justify-between">
                                <h4 className="text-label font-semibold tracking-tight">Size</h4>
                                <button
                                    type="button"
                                    onClick={() => t.setLocked(!t.locked)}
                                    aria-pressed={t.locked}
                                    className={twMerge(
                                        "inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-label font-medium transition-colors",
                                        t.locked ? "bg-brand-soft text-brand" : "text-fg-subtle hover:text-fg"
                                    )}
                                >
                                    {t.locked ? <IconLock size={15} /> : <IconLockOpen size={15} />}
                                    {t.locked ? "Ratio locked" : "Ratio free"}
                                </button>
                            </div>

                            <div className="mt-2.5 grid grid-cols-2 gap-3">
                                <label className="block">
                                    <span className="mb-1.5 block text-label font-medium text-fg-muted">Width (px)</span>
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        value={t.widthInput}
                                        onChange={(event) => t.onWidthChange(event.target.value)}
                                        onBlur={t.commitWidth}
                                        placeholder="auto"
                                        className={inputClass}
                                    />
                                </label>
                                <label className="block">
                                    <span className="mb-1.5 block text-label font-medium text-fg-muted">Height (px)</span>
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        value={t.heightInput}
                                        onChange={(event) => t.onHeightChange(event.target.value)}
                                        onBlur={t.commitHeight}
                                        placeholder="auto"
                                        className={inputClass}
                                    />
                                </label>
                            </div>
                            <p className="mt-2 text-label text-fg-subtle">
                                16–6000 px. Leave a field empty to keep that side automatic.
                            </p>
                        </section>

                        <div className="space-y-2.5">
                            <Button
                                type="button"
                                size="lg"
                                onClick={onDownload}
                                disabled={downloading}
                                aria-busy={downloading}
                                className="w-full"
                            >
                                {downloading ? <Spinner size={19} /> : <IconDownload size={19} />}
                                {downloading
                                    ? "Preparing…"
                                    : `Download ${t.width ?? "auto"}×${t.height ?? "auto"}`}
                            </Button>

                            {downloadError && (
                                <p role="alert" className="flex items-center justify-center gap-1.5 text-center text-label text-rose-500">
                                    <IconAlertTriangle size={15} className="shrink-0" />
                                    {downloadError}
                                </p>
                            )}
                        </div>

                        <section>
                            <h4 className="text-label font-semibold tracking-tight">Image URL</h4>
                            <div className="mt-2.5 flex gap-2">
                                <div className="flex h-11 min-w-0 flex-1 items-center gap-2 rounded-xl border border-border bg-bg-subtle px-3">
                                    <IconLink size={16} className="shrink-0 text-fg-subtle" />
                                    <input
                                        readOnly
                                        value={t.fullUrl}
                                        onFocus={(event) => event.currentTarget.select()}
                                        className="min-w-0 flex-1 bg-transparent font-mono text-code text-fg-muted outline-none"
                                    />
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={copyUrl}
                                    className="shrink-0 px-3"
                                    aria-label="Copy image URL"
                                >
                                    {copied ? <IconCheck size={17} className="text-emerald-500" /> : <IconCopy size={17} />}
                                </Button>
                            </div>
                        </section>
                    </div>
                </div>
            </Dialog.Body>
        </Dialog>
    );
};

export default PhotoDialog;
