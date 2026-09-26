"use client";
import { buildImageUrl, downloadName, type ImageTransform } from "./image-url";
import { Photo } from "@/_types";

/**
 * Starts a download without letting the click look like a navigation.
 *
 * The anchor is deliberately never inserted into the document: the app-wide
 * progress bar delegates from `document`, so a click that bubbles up from a
 * mounted anchor starts a loading bar that never finishes.
 */
function saveBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.rel = "noopener";
    anchor.click();
    // Revoking immediately can cancel the download in some browsers.
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

/** Whatever the `/image` route said went wrong, if it said anything. */
async function failureMessage(response: Response): Promise<string> {
    try {
        const body = (await response.json()) as { error?: unknown };
        if (typeof body.error === "string" && body.error) return body.error;
    } catch {
        /* not a JSON error body — fall back to the status */
    }
    return `The image could not be downloaded (HTTP ${response.status}).`;
}

/**
 * Fetches the photo at exactly the chosen size and crop, then saves it.
 *
 * `no-store` is the fix for "it always downloads the same image": the browser
 * must never answer a download from its cache, where an earlier response —
 * the wrong photo, or the right one at the wrong size — could be pinned.
 * Rejects on failure so the dialog can say so.
 */
export async function downloadPhoto(photo: Photo, transform: ImageTransform): Promise<void> {
    const href = buildImageUrl({ id: photo.id, ...transform, download: true });

    let response: Response;
    try {
        response = await fetch(href, { cache: "no-store" });
    } catch {
        throw new Error("Couldn't reach the server to download that image.");
    }

    if (!response.ok) throw new Error(await failureMessage(response));

    saveBlob(
        await response.blob(),
        downloadName(photo, transform.width ?? null, transform.height ?? null, transform.format)
    );
}
