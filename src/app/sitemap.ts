import type { MetadataRoute } from "next";

import { categories, popularSearches } from "@/lib/categories";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://imagisum.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
    const now = new Date();

    const staticRoutes = ["", "/docs"].map((path) => ({
        url: `${BASE_URL}${path}`,
        lastModified: now,
        changeFrequency: "daily" as const,
        priority: path === "" ? 1 : 0.8
    }));

    const categoryRoutes = categories.map((category) => ({
        url: `${BASE_URL}/discover/${category.slug}`,
        lastModified: now,
        changeFrequency: "weekly" as const,
        priority: 0.7
    }));

    const searchRoutes = popularSearches.map((term) => ({
        url: `${BASE_URL}/search/${encodeURIComponent(term)}`,
        lastModified: now,
        changeFrequency: "weekly" as const,
        priority: 0.5
    }));

    return [...staticRoutes, ...categoryRoutes, ...searchRoutes];
}
