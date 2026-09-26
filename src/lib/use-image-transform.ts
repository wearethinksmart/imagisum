"use client";
import { useCallback, useEffect, useMemo, useState } from "react";

import { buildImageUrl, clampDimension, type ImageTransform } from "./image-url";
import { Photo } from "@/_types";

/**
 * Owns every setting in the download dialog, so the crop preview and the
 * controls — which sit in different columns — never drift apart.
 */
export function useImageTransform(photo: Photo) {
    const ratio = photo.width / photo.height;

    // Held as raw strings while typing. Clamping mid-keystroke would rewrite "1"
    // into "16" before the user can finish typing "1280", and make the field
    // impossible to clear. Bounds are enforced on blur instead.
    const [widthInput, setWidthInput] = useState("1280");
    const [heightInput, setHeightInput] = useState(String(Math.round(1280 / ratio)));
    const [locked, setLocked] = useState(false);
    const [focalX, setFocalX] = useState(0.5);
    const [focalY, setFocalY] = useState(0.5);
    const [origin, setOrigin] = useState("");

    // A new photo starts from scratch: the last one's box and anchor mean
    // nothing for a picture of a different shape.
    useEffect(() => {
        setWidthInput("1280");
        setHeightInput(String(Math.round(1280 / ratio)));
        setFocalX(0.5);
        setFocalY(0.5);
    }, [photo.id, ratio]);

    // window is only available client-side; keeps SSR markup stable.
    useEffect(() => setOrigin(window.location.origin), []);

    // An empty field means "auto" — that dimension is left off the URL.
    const width = widthInput === "" ? null : Number(widthInput);
    const height = heightInput === "" ? null : Number(heightInput);

    const transform: ImageTransform = useMemo(
        () => ({ width, height, focalX, focalY }),
        [width, height, focalX, focalY]
    );

    const path = useMemo(() => buildImageUrl({ id: photo.id, ...transform }), [photo.id, transform]);

    /** Digits only, so `type=number` quirks like "e" and "-" can't get in. */
    const digitsOnly = (raw: string) => raw.replace(/\D/g, "").slice(0, 5);

    const onWidthChange = useCallback(
        (raw: string) => {
            const next = digitsOnly(raw);
            setWidthInput(next);
            if (locked && next) setHeightInput(String(Math.max(1, Math.round(Number(next) / ratio))));
        },
        [locked, ratio]
    );

    const onHeightChange = useCallback(
        (raw: string) => {
            const next = digitsOnly(raw);
            setHeightInput(next);
            if (locked && next) setWidthInput(String(Math.max(1, Math.round(Number(next) * ratio))));
        },
        [locked, ratio]
    );

    /** Snap into the supported range once the user is done with the field. */
    const commitWidth = useCallback(() => {
        if (!widthInput) return;
        const clamped = clampDimension(Number(widthInput));
        setWidthInput(String(clamped));
        if (locked) setHeightInput(String(Math.max(1, Math.round(clamped / ratio))));
    }, [widthInput, locked, ratio]);

    const commitHeight = useCallback(() => {
        if (!heightInput) return;
        const clamped = clampDimension(Number(heightInput));
        setHeightInput(String(clamped));
        if (locked) setWidthInput(String(Math.max(1, Math.round(clamped * ratio))));
    }, [heightInput, locked, ratio]);

    const applyPreset = useCallback((w: number, h: number) => {
        setWidthInput(String(w));
        setHeightInput(String(h));
    }, []);

    const setFocal = useCallback((x: number, y: number) => {
        setFocalX(x);
        setFocalY(y);
    }, []);

    return {
        widthInput,
        heightInput,
        width,
        height,
        locked,
        setLocked,
        focalX,
        focalY,
        setFocal,
        onWidthChange,
        onHeightChange,
        commitWidth,
        commitHeight,
        applyPreset,
        transform,
        path,
        fullUrl: `${origin}${path}`
    };
}
