import { Photo, PhotoPage } from "@/_types";
import { formatId } from "./photo-id";

const API_ROOT = "https://api.unsplash.com";

export const PER_PAGE = 24;

/** Unsplash asks for these on every link back to them. */
const UTM = "utm_source=imagisum&utm_medium=referral";

/**
 * How long an answer may be reused.
 *
 * - `hour`: listings that everyone sees the same way (home feed, categories).
 * - `none`: free-text search — always asked fresh.
 * - `forever`: a single photo's record, which never changes.
 */
export type CachePolicy = "hour" | "none" | "forever";

const HOUR = 60 * 60;

export class UnsplashError extends Error {
    status: number;
    constructor(message: string, status: number) {
        super(message);
        this.name = "UnsplashError";
        this.status = status;
    }
}

/**
 * `UNSPLASH_ACCESS_KEY` holds the key; several may be given comma-separated,
 * or as `UNSPLASH_ACCESS_KEY_<SUFFIX>`, and are tried in turn on a rate limit.
 */
const KEY_PATTERN = /^UNSPLASH_ACCESS_KEY(?:_[A-Za-z0-9]+)?$/;

function collectKeys(): string[] {
    const keys: string[] = [];

    for (const [name, value] of Object.entries(process.env).sort(([a], [b]) => a.localeCompare(b))) {
        if (!KEY_PATTERN.test(name) || !value) continue;
        for (const part of value.split(",")) {
            const key = part.trim();
            if (key && !keys.includes(key)) keys.push(key);
        }
    }

    return keys;
}

/** Unsplash limits per hour, so a throttled key rests for one. */
const cooldownUntil = new Map<string, number>();

const isUsable = (key: string) => (cooldownUntil.get(key) ?? 0) <= Date.now();

/** Unsplash answers a spent quota with 403 and "Rate Limit Exceeded", sometimes 429. */
async function isRateLimited(response: Response): Promise<boolean> {
    if (response.status === 429) return true;
    if (response.status !== 403) return false;
    if (response.headers.get("x-ratelimit-remaining") === "0") return true;
    return /rate limit/i.test(await response.text().catch(() => ""));
}

/**
 * Answers held in this process. `next dev` skips Next's fetch cache between
 * requests, so without this every refresh in development would spend quota.
 */
const answers = new Map<string, { expires: number; value: unknown }>();
const ANSWER_LIMIT = 300;

function recall<T>(url: string): T | undefined {
    const hit = answers.get(url);
    if (!hit) return undefined;
    if (hit.expires <= Date.now()) {
        answers.delete(url);
        return undefined;
    }
    return hit.value as T;
}

function remember(url: string, value: unknown, policy: CachePolicy) {
    if (policy === "none") return;
    answers.set(url, { expires: policy === "hour" ? Date.now() + HOUR * 1000 : Infinity, value });

    // A Map iterates in insertion order, so the first key is the oldest.
    if (answers.size > ANSWER_LIMIT) {
        const oldest = answers.keys().next().value;
        if (oldest !== undefined) answers.delete(oldest);
    }
}

/** Identical requests already in the air share one round trip. */
const inFlight = new Map<string, Promise<unknown>>();

function fetchOptions(policy: CachePolicy): RequestInit {
    if (policy === "none") return { cache: "no-store" };
    if (policy === "forever") return { cache: "force-cache" };
    return { next: { revalidate: HOUR } };
}

type Params = Record<string, string | number | undefined | null>;

async function request<T>(path: string, params: Params, policy: CachePolicy): Promise<T> {
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null && value !== "") search.set(key, String(value));
    }
    const query = search.toString();
    const url = `${API_ROOT}${path}${query ? `?${query}` : ""}`;

    const known = recall<T>(url);
    if (known !== undefined) return known;

    const shared = inFlight.get(url);
    if (shared) return shared as Promise<T>;

    const attempt = send<T>(url, policy);
    inFlight.set(url, attempt);

    try {
        const value = await attempt;
        remember(url, value, policy);
        return value;
    } finally {
        inFlight.delete(url);
    }
}

async function send<T>(url: string, policy: CachePolicy): Promise<T> {
    const keys = collectKeys();
    if (!keys.length) throw new UnsplashError("No Unsplash key is configured (set UNSPLASH_ACCESS_KEY).", 500);

    const available = keys.filter(isUsable);
    if (!available.length) throw new UnsplashError("Unsplash is rate limiting every key. Try again within the hour.", 429);

    for (const key of available) {
        const response = await fetch(url, {
            ...fetchOptions(policy),
            headers: { Authorization: `Client-ID ${key}`, "Accept-Version": "v1" }
        });

        if (response.ok) {
            cooldownUntil.delete(key);
            return response.json() as Promise<T>;
        }

        if (await isRateLimited(response)) {
            cooldownUntil.set(key, Date.now() + HOUR * 1000);
            continue;
        }

        throw new UnsplashError(`Unsplash request failed (${response.status}).`, response.status);
    }

    throw new UnsplashError("Unsplash is rate limiting every key. Try again within the hour.", 429);
}

interface RawPhoto {
    id: string;
    width: number;
    height: number;
    color: string | null;
    alt_description: string | null;
    description: string | null;
    urls: { raw: string };
    links: { html: string };
    user: { name: string; links: { html: string } };
}

/**
 * Raw URLs seen in listings, so the `/image` route can usually skip asking the
 * API where a photo lives. Per server instance, and bounded.
 */
const knownRaw = new Map<string, string>();
const KNOWN_LIMIT = 5000;

function learn(raw: RawPhoto) {
    knownRaw.set(raw.id, raw.urls.raw);
    if (knownRaw.size > KNOWN_LIMIT) {
        const oldest = knownRaw.keys().next().value;
        if (oldest !== undefined) knownRaw.delete(oldest);
    }
}

const sized = (raw: string, width: number) => `${raw}&w=${width}&q=75&auto=format`;

function normalise(raw: RawPhoto): Photo {
    learn(raw);

    return {
        id: formatId("unsplash", raw.id),
        source: "unsplash",
        width: raw.width,
        height: raw.height,
        color: raw.color,
        alt: raw.alt_description || raw.description || `Photo by ${raw.user.name}`,
        photographer: raw.user.name,
        photographerUrl: `${raw.user.links.html}?${UTM}`,
        pageUrl: `${raw.links.html}?${UTM}`,
        thumb: sized(raw.urls.raw, 800),
        preview: sized(raw.urls.raw, 1600)
    };
}

/** Unsplash's editorial feed. */
export async function getFeed(page = 1, perPage = PER_PAGE): Promise<PhotoPage> {
    const raw = await request<RawPhoto[]>("/photos", { page, per_page: perPage }, "hour");

    return {
        photos: raw.map(normalise),
        page,
        totalResults: null,
        nextPage: raw.length === perPage ? page + 1 : null
    };
}

export async function searchPhotos(
    query: string,
    { page = 1, perPage = PER_PAGE, cache = "none" }: { page?: number; perPage?: number; cache?: CachePolicy } = {}
): Promise<PhotoPage> {
    const raw = await request<{ total: number; total_pages: number; results: RawPhoto[] }>(
        "/search/photos",
        { query, page, per_page: perPage, content_filter: "high" },
        cache
    );

    return {
        photos: raw.results.map(normalise),
        page,
        totalResults: raw.total,
        nextPage: page < raw.total_pages ? page + 1 : null
    };
}

/** Where a photo's original lives. Cached for good: it never moves. */
export async function getRawUrl(id: string): Promise<string> {
    const known = knownRaw.get(id);
    if (known) return known;

    const raw = await request<RawPhoto>(`/photos/${encodeURIComponent(id)}`, {}, "forever");
    learn(raw);
    return raw.urls.raw;
}

/**
 * Unsplash's guidelines require this call whenever a photo is downloaded.
 * Best effort: a failed ping must never fail the download itself.
 */
export async function trackDownload(id: string): Promise<void> {
    try {
        await request(`/photos/${encodeURIComponent(id)}/download`, {}, "none");
    } catch {
        /* ignored — see above */
    }
}

/** Turns a caught error into something worth showing a visitor. */
export function describeError(error: unknown, subject = "content"): string {
    if (error instanceof UnsplashError && error.status === 429) {
        return `This ${subject} couldn't load — ${error.message}`;
    }
    return `This ${subject} couldn't load right now. Try again in a moment.`;
}
