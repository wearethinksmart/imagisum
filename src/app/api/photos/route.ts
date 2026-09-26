import { NextRequest, NextResponse } from "next/server";

import { getCategoryPhotos, getHomeFeed, getSearchPhotos } from "@/lib/photos";
import { getCategory } from "@/lib/categories";
import { UnsplashError } from "@/lib/unsplash";
import { cacheHeaders } from "@/lib/cache-headers";

/**
 * Next pages for the infinite-scroll grid.
 *
 *   /api/photos?page=2                  home feed (cached an hour)
 *   /api/photos?category=nature&page=2  a category (cached an hour)
 *   /api/photos?query=cats&page=2       a search (never cached)
 */
export async function GET(request: NextRequest) {
    const params = request.nextUrl.searchParams;
    const page = Math.min(500, Math.max(1, Number(params.get("page") ?? 1) || 1));
    const query = params.get("query")?.trim();
    const slug = params.get("category");

    try {
        if (query) {
            return NextResponse.json(await getSearchPhotos(query, page), { headers: cacheHeaders("none") });
        }

        if (slug) {
            const category = getCategory(slug);
            if (!category) return NextResponse.json({ error: "Unknown category." }, { status: 404 });
            return NextResponse.json(await getCategoryPhotos(category.query, page), { headers: cacheHeaders("hour") });
        }

        return NextResponse.json(await getHomeFeed(page), { headers: cacheHeaders("hour") });
    } catch (error) {
        const status = error instanceof UnsplashError && error.status === 429 ? 429 : 500;
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to fetch photos" },
            { status, headers: cacheHeaders("none") }
        );
    }
}
