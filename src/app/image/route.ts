import { after, type NextRequest, NextResponse } from "next/server";
import { getRandomPhoto } from "@/lib/photos";
import { getPicsumInfo, picsumUrl } from "@/lib/picsum";
import { getRawUrl, trackDownload, UnsplashError } from "@/lib/unsplash";
import { parseId, type ParsedId } from "@/lib/photo-id";
import {
    buildUnsplashUrl,
    clamp,
    clampDimension,
    clampFocal,
    contentTypeFor,
    DEFAULT_QUALITY,
    downloadName,
    FORMATS,
    isOffCentre,
    outputFormat,
    type Format,
    type ImageTransform
} from "@/lib/image-url";
import { cacheHeaders } from "@/lib/cache-headers";

export const dynamic = "force-dynamic";

function dimension(raw: string | null): number | null {
    if (!raw) return null;
    const value = Number(raw);
    return Number.isFinite(value) && value > 0 ? clampDimension(value) : null;
}

function numeric(raw: string | null, min: number, max: number): number | null {
    if (!raw) return null;
    const value = Number(raw);
    return Number.isFinite(value) ? clamp(value, min, max) : null;
}

function flag(params: URLSearchParams, key: string): boolean {
    const value = params.get(key);
    return value === "1" || value === "true";
}

function readTransform(params: URLSearchParams): ImageTransform {
    const formatParam = params.get("format") ?? params.get("fm");
    const format = FORMATS.includes(formatParam as Format) ? (formatParam as Format) : "jpg";

    return {
        width: dimension(params.get("width") ?? params.get("w")),
        height: dimension(params.get("height") ?? params.get("h")),
        focalX: numeric(params.get("fp-x"), 0, 1),
        focalY: numeric(params.get("fp-y"), 0, 1),
        format,
        quality: numeric(params.get("q") ?? params.get("quality"), 1, 100),
        blur: numeric(params.get("blur"), 0, 100),
        grayscale: flag(params, "grayscale") || flag(params, "greyscale")
    };
}

const CORS = {
    // The whole point is hotlinking, so cross-origin `fetch` should work too.
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
    "Access-Control-Expose-Headers": "X-Photo-Id, Content-Length"
};

export function OPTIONS() {
    return new NextResponse(null, { status: 204, headers: CORS });
}

class HttpError extends Error {
    constructor(message: string, public status: number) {
        super(message);
    }
}

function errorResponse(message: string, status: number) {
    // Failures must never be cached, or a blip gets pinned for a year.
    const headers: Record<string, string> = { ...CORS, ...cacheHeaders("none") };
    // Unsplash quotas reset hourly; tell clients not to hammer us before then.
    if (status === 429) headers["Retry-After"] = "600";
    return NextResponse.json({ error: message }, { status, headers });
}

async function unsplashUpstream(id: string, transform: ImageTransform): Promise<string> {
    try {
        return buildUnsplashUrl(await getRawUrl(id), transform);
    } catch (error) {
        if (error instanceof UnsplashError) {
            if (error.status === 404) throw new HttpError("No photo with that id.", 404);
            if (error.status === 429) throw new HttpError(error.message, 429);
        }
        throw new HttpError("Upstream photo lookup failed.", 502);
    }
}

/**
 * Picsum resizes and crops to the centre on its own, and serves JPEG or WebP.
 * Anything past that — an off-centre crop, PNG, a quality setting — goes
 * through wsrv.nl, an open-source image CDN, from a copy just big enough to
 * cover the box. Nothing is processed on this server.
 */
async function picsumUpstream(id: string, transform: ImageTransform): Promise<string> {
    let { width, height } = transform;
    const format = outputFormat("picsum", transform.format);
    // Picsum's own effects: a bare `grayscale` flag, and blur on a 1–10 scale.
    const effects = [
        transform.grayscale && "grayscale",
        transform.blur && `blur=${clamp(Math.round(transform.blur / 10), 1, 10)}`
    ].filter(Boolean).join("&");
    const suffix = `.${format === "webp" ? "webp" : "jpg"}${effects ? `?${effects}` : ""}`;

    const nativeOutput = (format === "jpg" || format === "webp") && (transform.quality ?? DEFAULT_QUALITY) === DEFAULT_QUALITY;

    // The common case — an exact box, centred — needs nothing but a redirect.
    if (width && height && nativeOutput && !isOffCentre(transform)) {
        return picsumUrl(id, width, height) + suffix;
    }

    const info = await getPicsumInfo(id);
    if (!info) throw new HttpError("No photo with that id.", 404);

    const ratio = info.width / info.height;
    if (!width && !height) {
        width = info.width;
        height = info.height;
    } else if (!width) {
        width = clampDimension((height as number) * ratio);
    } else if (!height) {
        height = clampDimension(width / ratio);
    }

    const w = width as number;
    const h = height as number;

    if (nativeOutput && !isOffCentre(transform)) {
        return picsumUrl(id, w, h) + suffix;
    }

    // A copy that covers the box, so wsrv only has to cut the box out of it.
    const scale = Math.max(w / info.width, h / info.height);
    const coverW = Math.max(w, Math.ceil(info.width * scale));
    const coverH = Math.max(h, Math.ceil(info.height * scale));
    if (coverW > 10000 || coverH > 10000) throw new HttpError("That size is too extreme for this photo.", 400);

    const percent = (value: number | null | undefined) => Math.round(clampFocal(value ?? 0.5) * 100);
    const params = new URLSearchParams({
        url: picsumUrl(id, coverW, coverH) + suffix,
        w: String(w),
        h: String(h),
        fit: "cover",
        a: `focal-${percent(transform.focalX)}-${percent(transform.focalY)}`,
        output: format,
        q: String(transform.quality ?? DEFAULT_QUALITY)
    });
    return `https://wsrv.nl/?${params}`;
}

/** The finished bytes, fetched fresh — the response itself is what gets cached. */
async function render(url: string, format: Format | undefined): Promise<{ body: BodyInit; type: string }> {
    let response: Response;
    try {
        response = await fetch(url, { cache: "no-store" });
    } catch {
        throw new HttpError("Could not reach the image CDN.", 502);
    }

    if (response.status === 404) throw new HttpError("No photo with that id.", 404);
    if (!response.ok || !response.body) throw new HttpError("Could not fetch the image data.", 502);

    return { body: response.body, type: response.headers.get("content-type") ?? contentTypeFor(format) };
}

async function serve(request: NextRequest) {
    const params = request.nextUrl.searchParams;
    const random = flag(params, "random");
    const download = flag(params, "download");
    const transform = readTransform(params);

    let id = params.get("id");

    if (random) {
        const photo = await getRandomPhoto(params.get("query")?.trim() || undefined);
        if (!photo) return errorResponse("No photo matched that query.", 404);
        id = photo.id;
    }

    if (!id) return errorResponse("Provide `id`, or `random=1` (optionally with `query`).", 400);

    const parsed: ParsedId | null = parseId(id);
    if (!parsed) return errorResponse("`id` must look like `u-<unsplash id>` or `p-<picsum id>`.", 400);

    // Random and downloads are always fresh; a specific photo at a specific
    // size never changes, so its link is cached for good.
    const policy = random || download ? "none" : "forever";
    const headers = new Headers({ ...CORS, ...cacheHeaders(policy), "X-Photo-Id": id });

    try {
        const upstream =
            parsed.source === "unsplash"
                ? await unsplashUpstream(parsed.raw, transform)
                : await picsumUpstream(parsed.raw, transform);

        // A plain link just points the browser at the provider's CDN: nothing
        // flows through this server, and Unsplash asks for hotlinking anyway.
        if (!download) {
            headers.set("Location", upstream);
            return new NextResponse(null, { status: 302, headers });
        }

        const format = outputFormat(parsed.source, transform.format);
        const { body, type } = await render(upstream, format);
        headers.set("Content-Type", type);

        if (download) {
            const name = downloadName({ id }, transform.width ?? null, transform.height ?? null, format);
            headers.set("Content-Disposition", `attachment; filename="${name}"`);
            if (parsed.source === "unsplash") after(() => trackDownload(parsed.raw));
        }

        return new NextResponse(body, { headers });
    } catch (error) {
        if (error instanceof HttpError) return errorResponse(error.message, error.status);
        console.error("/image failed", error);
        return errorResponse("The image could not be produced.", 500);
    }
}

export function GET(request: NextRequest) {
    return serve(request);
}
