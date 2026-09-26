"use client";
import { ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { IconAlertTriangle, IconPhotoOff } from "@tabler/icons-react";

import PhotoCard from "./PhotoCard";
import Button from "../ui/Button";
import EmptyState from "../ui/EmptyState";
import Spinner from "../ui/Spinner";
import { Photo, PhotoPage } from "@/_types";
import { gridColumns } from "./grid-layout";

interface Props {
    initial: PhotoPage;
    /** API path that accepts a `page` param, e.g. `/api/photos?query=cats`. */
    endpoint: string;
    emptyTitle?: string;
    emptyDescription?: string;
    emptyAction?: ReactNode;
    className?: string;
}

const PhotoGrid = ({ initial, endpoint, emptyTitle, emptyDescription, emptyAction, className }: Props) => {
    const [photos, setPhotos] = useState<Photo[]>(initial.photos);
    const [nextPage, setNextPage] = useState<number | null>(initial.nextPage);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const sentinelRef = useRef<HTMLDivElement>(null);
    const seenIds = useRef(new Set(initial.photos.map((photo) => photo.id)));

    // A new endpoint means a new feed — start over.
    useEffect(() => {
        setPhotos(initial.photos);
        setNextPage(initial.nextPage);
        setError(null);
        seenIds.current = new Set(initial.photos.map((photo) => photo.id));
    }, [endpoint, initial]);

    const loadMore = useCallback(async () => {
        if (loading || nextPage === null) return;

        setLoading(true);
        setError(null);

        try {
            const separator = endpoint.includes("?") ? "&" : "?";
            const response = await fetch(`${endpoint}${separator}page=${nextPage}`);
            if (!response.ok) throw new Error("Request failed");

            const data: PhotoPage = await response.json();
            // Feeds repeat photos across pages often enough to matter.
            const fresh = data.photos.filter((photo) => !seenIds.current.has(photo.id));
            fresh.forEach((photo) => seenIds.current.add(photo.id));

            setPhotos((prev) => [...prev, ...fresh]);
            setNextPage(data.nextPage);
        } catch {
            setError("Couldn't load more photos.");
        } finally {
            setLoading(false);
        }
    }, [endpoint, loading, nextPage]);

    // Only once the visitor actually nears the end — never on first paint.
    useEffect(() => {
        const target = sentinelRef.current;
        if (!target || nextPage === null || error) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) loadMore();
            },
            { rootMargin: "300px 0px" }
        );

        observer.observe(target);
        return () => observer.disconnect();
    }, [loadMore, nextPage, error]);

    if (!photos.length) {
        return (
            <EmptyState
                icon={<IconPhotoOff size={26} />}
                title={emptyTitle ?? "No photos found"}
                description={emptyDescription ?? "Try a different search term or browse a category instead."}
            >
                {emptyAction}
            </EmptyState>
        );
    }

    return (
        <div className={className}>
            <div className={gridColumns}>
                {photos.map((photo, index) => (
                    <PhotoCard key={photo.id} item={photo} priority={index < 4} />
                ))}
            </div>

            <div ref={sentinelRef} className="flex flex-col items-center justify-center gap-4 py-12">
                {loading && <Spinner className="text-brand" size={26} />}

                {error && (
                    <div className="flex flex-col items-center gap-3 text-center">
                        <p className="flex items-center gap-2 text-body text-fg-muted">
                            <IconAlertTriangle size={17} className="text-amber-500" />
                            {error}
                        </p>
                        <Button variant="outline" size="sm" onClick={loadMore}>
                            Try again
                        </Button>
                    </div>
                )}

                {nextPage === null && (
                    <p className="text-body text-fg-subtle">You&apos;ve reached the end — {photos.length} photos.</p>
                )}
            </div>
        </div>
    );
};

export { gridColumns, PhotoGridSkeleton } from "./grid-layout";

export default PhotoGrid;
