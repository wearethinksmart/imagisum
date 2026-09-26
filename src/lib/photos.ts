import { Photo, PhotoPage } from "@/_types";
import { getPicsumPage, getRandomPicsum } from "./picsum";
import { getFeed, PER_PAGE, searchPhotos } from "./unsplash";

/**
 * Which provider answers what:
 *
 * - Home feed: Unsplash, cached an hour, falling back to Picsum so the front
 *   page is never empty just because the hourly quota ran out.
 * - Search: Unsplash, never cached.
 * - Categories: Unsplash, cached an hour — they are fixed queries.
 * - Random (hero, `/image?random=1`): Picsum, which has no limit at all.
 */
export async function getHomeFeed(page = 1): Promise<PhotoPage> {
    try {
        return await getFeed(page);
    } catch {
        return getPicsumPage(page, PER_PAGE);
    }
}

export function getCategoryPhotos(query: string, page = 1): Promise<PhotoPage> {
    return searchPhotos(query, { page, cache: "hour" });
}

export function getSearchPhotos(query: string, page = 1): Promise<PhotoPage> {
    return searchPhotos(query, { page, cache: "none" });
}

/**
 * A random photo. With a subject it draws from that subject's first page of
 * Unsplash results (cached an hour, so repeated calls cost nothing); without
 * one, or if Unsplash is unavailable, it comes from Picsum.
 */
export async function getRandomPhoto(query?: string): Promise<Photo | null> {
    if (query) {
        try {
            const { photos } = await searchPhotos(query, { perPage: 30, cache: "hour" });
            if (photos.length) return photos[Math.floor(Math.random() * photos.length)];
        } catch {
            /* fall through to Picsum */
        }
    }
    return getRandomPicsum();
}

export function emptyPage(): PhotoPage {
    return { photos: [], page: 1, totalResults: 0, nextPage: null };
}
