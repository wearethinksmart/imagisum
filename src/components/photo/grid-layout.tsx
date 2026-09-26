import { twMerge } from "tailwind-merge";

/**
 * The masonry column rules and the loading skeleton, kept apart from
 * `PhotoGrid` itself. Pages that only need a placeholder — downloads history,
 * the boards index — would otherwise pull in the whole grid, selection and
 * dialog chain just to render a few grey boxes.
 */
export const gridColumns = "columns-2 gap-3 sm:columns-2 sm:gap-4 lg:columns-3 2xl:columns-4";

export const PhotoGridSkeleton = ({ count = 12 }: { count?: number }) => (
    <div className={gridColumns}>
        {Array.from({ length: count }).map((_, index) => (
            <div
                key={index}
                className={twMerge("mb-4 w-full animate-pulse rounded-2xl bg-bg-inset")}
                // Varied but deterministic heights, so the skeleton looks like a
                // masonry grid without causing a hydration mismatch.
                style={{ height: 180 + ((index * 47) % 220) }}
            />
        ))}
    </div>
);
