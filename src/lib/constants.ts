/**
 * Shared constants — kept out of "use client" modules so server components can
 * import them without crossing the client boundary.
 */

export const HEADER_HEIGHT = 72;

export const SITE_NAME = "Imagisum";
export const SITE_DESCRIPTION =
    "Search free stock photos and download them at any size — or hotlink them straight into your markup.";
export const GITHUB_URL = "https://github.com/siamahnaf/imagisum";
/** Unsplash asks for these UTM params on every link back to them. */
export const UNSPLASH_URL = "https://unsplash.com/?utm_source=imagisum&utm_medium=referral";
