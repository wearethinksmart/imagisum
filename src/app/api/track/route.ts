import { NextRequest, NextResponse } from "next/server";

import { parseId } from "@/lib/photo-id";
import { trackDownload } from "@/lib/unsplash";

/**
 * Reports a use of an Unsplash photo that isn't a download through `/image` —
 * copying its URL into a project, for one. Unsplash's guidelines count that as
 * a download too. POST, so nothing can prefetch or cache it.
 */
export async function POST(request: NextRequest) {
    const parsed = parseId(request.nextUrl.searchParams.get("id") ?? "");
    if (parsed?.source === "unsplash") await trackDownload(parsed.raw);
    return new NextResponse(null, { status: 204, headers: { "Cache-Control": "no-store" } });
}
