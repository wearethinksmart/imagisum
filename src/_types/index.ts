export type PhotoSource = "unsplash" | "picsum";

/** One photo, whichever provider it came from. */
export interface Photo {
    /** Prefixed with its source — `u-<unsplash id>` or `p-<picsum id>`. */
    id: string;
    source: PhotoSource;
    width: number;
    height: number;
    color: string | null;
    alt: string;
    photographer: string;
    photographerUrl: string;
    /** The photo's own page on Unsplash. */
    pageUrl: string;
    /** ~800px wide, for grid cards. */
    thumb: string;
    /** ~1600px wide, for the dialog and the hero. */
    preview: string;
}

/** Normalised payload every gallery endpoint in this app returns. */
export interface PhotoPage {
    photos: Photo[];
    page: number;
    totalResults: number | null;
    nextPage: number | null;
}
