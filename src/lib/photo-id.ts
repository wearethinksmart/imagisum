import { PhotoSource } from "@/_types";

export interface ParsedId {
    source: PhotoSource;
    /** The provider's own id, without our prefix. */
    raw: string;
}

const PREFIX: Record<PhotoSource, string> = { unsplash: "u-", picsum: "p-" };

export function formatId(source: PhotoSource, raw: string): string {
    return `${PREFIX[source]}${raw}`;
}

/**
 * `u-<id>` is Unsplash, `p-<id>` is Picsum. A bare number is read as Picsum,
 * so `/image?id=237` works as the shortest possible link.
 */
export function parseId(id: string): ParsedId | null {
    if (/^\d+$/.test(id)) return { source: "picsum", raw: id };
    if (/^p-\d+$/.test(id)) return { source: "picsum", raw: id.slice(2) };
    // Unsplash ids are 11 url-safe characters, `-` and `_` included.
    if (/^u-[A-Za-z0-9_-]{6,20}$/.test(id)) return { source: "unsplash", raw: id.slice(2) };
    return null;
}
