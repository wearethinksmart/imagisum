import { Photo, PhotoPage } from "@/_types";
import { formatId } from "./photo-id";

/**
 * Lorem Picsum: no key and no rate limit, but also no search — about a
 * thousand hand-picked Unsplash photos. It covers the places where any good
 * photo will do: the hero, the random endpoint, and the home feed whenever
 * Unsplash is unavailable.
 */
const ROOT = "https://picsum.photos";

/** The catalogue barely changes; an hour keeps the hero varied enough. */
const LIST_REVALIDATE = 60 * 60;

/** 993 photos at the time of writing: ten pages of 100. */
const RANDOM_PAGES = 9;

interface RawPicsum {
    id: string;
    author: string;
    width: number;
    height: number;
    url: string;
    download_url: string;
}

/** A Picsum image at exactly this size; Picsum crops to the centre. */
export function picsumUrl(id: string, width: number, height: number): string {
    return `${ROOT}/id/${id}/${Math.round(width)}/${Math.round(height)}`;
}

function normalise(raw: RawPicsum): Photo {
    const ratio = raw.height / raw.width;

    return {
        id: formatId("picsum", raw.id),
        source: "picsum",
        width: raw.width,
        height: raw.height,
        color: null,
        alt: `Photo by ${raw.author}`,
        photographer: raw.author,
        // Picsum doesn't link the author, only the photo on Unsplash.
        photographerUrl: raw.url,
        pageUrl: raw.url,
        thumb: picsumUrl(raw.id, 800, 800 * ratio),
        preview: picsumUrl(raw.id, 1600, 1600 * ratio)
    };
}

async function getJson<T>(path: string, init: RequestInit): Promise<T> {
    const response = await fetch(`${ROOT}${path}`, init);
    if (!response.ok) throw new Error(`Picsum request failed (${response.status}).`);
    return response.json() as Promise<T>;
}

export async function getPicsumPage(page = 1, perPage = 24): Promise<PhotoPage> {
    const raw = await getJson<RawPicsum[]>(`/v2/list?page=${page}&limit=${perPage}`, {
        next: { revalidate: LIST_REVALIDATE }
    });

    return {
        photos: raw.map(normalise),
        page,
        totalResults: null,
        nextPage: raw.length === perPage ? page + 1 : null
    };
}

/** One photo from anywhere in the catalogue. Each page is cached for an hour. */
export async function getRandomPicsum(): Promise<Photo | null> {
    try {
        const page = 1 + Math.floor(Math.random() * RANDOM_PAGES);
        const { photos } = await getPicsumPage(page, 100);
        return photos[Math.floor(Math.random() * photos.length)] ?? null;
    } catch {
        return null;
    }
}

/** A photo's record never changes, so it is cached for good. */
export async function getPicsumInfo(id: string): Promise<{ width: number; height: number } | null> {
    try {
        const raw = await getJson<RawPicsum>(`/id/${id}/info`, { cache: "force-cache" });
        return { width: raw.width, height: raw.height };
    } catch {
        return null;
    }
}
