"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { IconCrosshair, IconRestore } from "@tabler/icons-react";
import { twMerge } from "tailwind-merge";

import { Photo } from "@/_types";

interface Props {
    photo: Photo;
    width: number | null;
    height: number | null;
    focalX: number;
    focalY: number;
    onFocalChange: (x: number, y: number) => void;
    className?: string;
}

/**
 * Shows exactly what the chosen settings will produce.
 *
 * The whole photo is always visible, with the kept region drawn on top and
 * everything outside it dimmed — so the trimmed area is obvious rather than
 * invisible. Dragging the box moves the crop anchor, which is what gets sent
 * as `fp-x`/`fp-y`.
 *
 * Crop geometry: cropping to a target ratio keeps the full width *or* the full
 * height and trims the other axis, so the box only ever slides along one axis.
 */
const CropPreview = ({
    photo,
    width,
    height,
    focalX,
    focalY,
    onFocalChange,
    className
}: Props) => {
    const frameRef = useRef<HTMLDivElement>(null);
    const [dragging, setDragging] = useState(false);

    /**
     * Distance from the pointer to the box's centre at the moment of grabbing.
     * Without it the box jumps so its centre lands under the cursor, which
     * reads as a flicker whenever you grab anywhere but the exact middle.
     */
    const grabOffset = useRef({ x: 0, y: 0 });

    const sourceAspect = photo.width / photo.height;

    // Cropping only happens when both sides are pinned. One free side means
    // the ratio is preserved and nothing is trimmed.
    const crops = Boolean(width) && Boolean(height);
    const targetAspect = crops ? (width as number) / (height as number) : sourceAspect;

    // Kept region as a fraction of the source, per axis.
    const cropW = crops ? Math.min(1, targetAspect / sourceAspect) : 1;
    const cropH = crops ? Math.min(1, sourceAspect / targetAspect) : 1;

    /*
     * Travel limits for the box's *centre*. The box spans `cropW` of the image,
     * so its centre can never come closer to an edge than half of that — at
     * cropW = 1 the only legal centre is 0.5. Bounding by `(1 - cropW) / 2`
     * instead had it backwards: a full-width crop was free to travel the whole
     * axis, which pushed the box clean off the photo.
     */
    const minX = cropW / 2;
    const maxX = 1 - cropW / 2;
    const minY = cropH / 2;
    const maxY = 1 - cropH / 2;

    const clampX = useCallback((value: number) => Math.min(maxX, Math.max(minX, value)), [minX, maxX]);
    const clampY = useCallback((value: number) => Math.min(maxY, Math.max(minY, value)), [minY, maxY]);

    const x = clampX(focalX);
    const y = clampY(focalY);

    /** Pointer position as a 0–1 fraction of the frame. */
    const fractionAt = useCallback((clientX: number, clientY: number) => {
        const rect = frameRef.current?.getBoundingClientRect();
        if (!rect?.width || !rect.height) return null;
        return { x: (clientX - rect.left) / rect.width, y: (clientY - rect.top) / rect.height };
    }, []);

    const dragTo = useCallback(
        (clientX: number, clientY: number) => {
            const point = fractionAt(clientX, clientY);
            if (!point) return;
            onFocalChange(
                clampX(point.x + grabOffset.current.x),
                clampY(point.y + grabOffset.current.y)
            );
        },
        [fractionAt, clampX, clampY, onFocalChange]
    );

    // Pointer capture would be lost if the drag leaves the frame, so the move
    // and up handlers live on the window for the duration of the gesture.
    useEffect(() => {
        if (!dragging) return;

        const onMove = (event: PointerEvent) => {
            event.preventDefault();
            dragTo(event.clientX, event.clientY);
        };
        const onUp = () => setDragging(false);

        window.addEventListener("pointermove", onMove, { passive: false });
        window.addEventListener("pointerup", onUp);
        window.addEventListener("pointercancel", onUp);
        return () => {
            window.removeEventListener("pointermove", onMove);
            window.removeEventListener("pointerup", onUp);
            window.removeEventListener("pointercancel", onUp);
        };
    }, [dragging, dragTo]);

    // Draggable only where the box actually has room to move: an axis the crop
    // spans completely is fixed, so both axes being full means nothing to drag.
    const adjustable = crops && (maxX - minX > 0.001 || maxY - minY > 0.001);

    /**
     * Grabbing inside the box picks it up where it was touched; clicking the
     * dimmed area outside recentres on that point and then drags from there.
     */
    const onPointerDown = (event: React.PointerEvent) => {
        if (!adjustable) return;
        event.preventDefault();

        const point = fractionAt(event.clientX, event.clientY);
        if (!point) return;

        const inside =
            Math.abs(point.x - x) <= cropW / 2 && Math.abs(point.y - y) <= cropH / 2;

        grabOffset.current = inside ? { x: x - point.x, y: y - point.y } : { x: 0, y: 0 };

        setDragging(true);
        if (!inside) onFocalChange(clampX(point.x), clampY(point.y));
    };

    const nudge = (event: React.KeyboardEvent) => {
        const step = event.shiftKey ? 0.1 : 0.02;
        const map: Record<string, [number, number]> = {
            ArrowLeft: [-step, 0],
            ArrowRight: [step, 0],
            ArrowUp: [0, -step],
            ArrowDown: [0, step]
        };
        const delta = map[event.key];
        if (!delta) return;
        event.preventDefault();
        onFocalChange(clampX(x + delta[0]), clampY(y + delta[1]));
    };

    return (
        <div className={className}>
            {/* Just enough padding that the crop outline stays readable instead
                of merging with the frame border when the box reaches the end of
                its travel — deliberately tight, so the photo stays the focus. */}
            <div className="flex justify-center rounded-xl border border-border bg-bg-inset p-2 sm:p-2.5">
                <div
                    ref={frameRef}
                    // The whole frame is the drag surface, so the box can be
                    // picked up anywhere rather than only by its centre.
                    onPointerDown={onPointerDown}
                    className={twMerge(
                        "relative w-full select-none touch-none",
                        adjustable && (dragging ? "cursor-grabbing" : "cursor-grab")
                    )}
                    style={{
                        /*
                         * Height is capped through max-width, not max-height. A
                         * max-height would clamp the height while the width
                         * stayed at 100%, breaking the aspect ratio — the image
                         * would then letterbox inside a wider frame while the
                         * crop box stayed measured against the frame, so the two
                         * stopped lining up. Deriving the width cap from the
                         * ratio keeps the frame exactly equal to the image.
                         */
                        aspectRatio: `${photo.width} / ${photo.height}`,
                        maxWidth: `calc(42vh * ${(photo.width / photo.height).toFixed(4)})`,
                        // Belt and braces: nothing inside can ever paint outside
                        // the photo and over the panel beside it.
                        contain: "paint"
                    }}
                >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={photo.preview}
                    alt={photo.alt}
                    draggable={false}
                    className="pointer-events-none absolute inset-0 size-full object-contain"
                    style={{ backgroundColor: photo.color ?? undefined }}
                />

                {crops && (
                    <>
                        {/* Dim everything the crop will throw away. */}
                        <div
                            className="pointer-events-none absolute inset-0 bg-black/55"
                            style={{
                                clipPath: `polygon(
                                    0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 0%,
                                    ${(x - cropW / 2) * 100}% ${(y - cropH / 2) * 100}%,
                                    ${(x - cropW / 2) * 100}% ${(y + cropH / 2) * 100}%,
                                    ${(x + cropW / 2) * 100}% ${(y + cropH / 2) * 100}%,
                                    ${(x + cropW / 2) * 100}% ${(y - cropH / 2) * 100}%,
                                    ${(x - cropW / 2) * 100}% ${(y - cropH / 2) * 100}%
                                )`
                            }}
                        />

                        <div
                            role={adjustable ? "slider" : undefined}
                            tabIndex={adjustable ? 0 : undefined}
                            aria-label={adjustable ? "Crop position" : undefined}
                            aria-valuetext={
                                adjustable ? `${Math.round(x * 100)}% across, ${Math.round(y * 100)}% down` : undefined
                            }
                            onKeyDown={adjustable ? nudge : undefined}
                            className={twMerge(
                                // Pointer events stay on the frame so a grab is
                                // handled in one place, with one offset calculation.
                                // Square corners: the outline marks an exact
                                // pixel boundary, so it shouldn't imply a
                                // rounded one.
                                "pointer-events-none absolute rounded-none border-2 border-white/95 shadow-[0_0_0_1px_rgba(0,0,0,0.45)] outline-none",
                                adjustable && "focus-visible:ring-2 focus-visible:ring-ring"
                            )}
                            style={{
                                left: `${(x - cropW / 2) * 100}%`,
                                top: `${(y - cropH / 2) * 100}%`,
                                width: `${cropW * 100}%`,
                                height: `${cropH * 100}%`
                            }}
                        >
                            {/* Rule-of-thirds guides, only while actively dragging. */}
                            {dragging && (
                                <>
                                    <span className="absolute inset-y-0 left-1/3 w-px bg-white/40" />
                                    <span className="absolute inset-y-0 left-2/3 w-px bg-white/40" />
                                    <span className="absolute inset-x-0 top-1/3 h-px bg-white/40" />
                                    <span className="absolute inset-x-0 top-2/3 h-px bg-white/40" />
                                </>
                            )}
                            {adjustable && (
                                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white/90 drop-shadow">
                                    <IconCrosshair size={18} />
                                </span>
                            )}
                        </div>
                    </>
                )}
                </div>
            </div>

            <div className="mt-2 flex min-h-6 items-center gap-2 text-meta text-fg-subtle">
                {adjustable ? (
                    <>
                        <span>Drag anywhere to choose what stays in frame.</span>
                        {(Math.abs(x - 0.5) > 0.001 || Math.abs(y - 0.5) > 0.001) && (
                            <button
                                type="button"
                                onClick={() => onFocalChange(0.5, 0.5)}
                                className="ml-auto inline-flex items-center gap-1 font-medium text-fg-muted transition-colors hover:text-fg"
                            >
                                <IconRestore size={13} />
                                Recentre
                            </button>
                        )}
                    </>
                ) : (
                    <span>
                        {crops
                            ? "This ratio matches the photo, so nothing is trimmed."
                            : "Ratio preserved — nothing is trimmed."}
                    </span>
                )}
            </div>
        </div>
    );
};

export default CropPreview;
