import type { Metadata } from "next";
import Link from "next/link";
import { IconSearch } from "@tabler/icons-react";

import Container from "@/components/ui/Container";
import PageHeader from "@/components/ui/PageHeader";
import PhotoGrid from "@/components/photo/PhotoGrid";
import Notice from "@/components/ui/Notice";
import Chip from "@/components/ui/Chip";
import { emptyPage, getSearchPhotos } from "@/lib/photos";
import { describeError } from "@/lib/unsplash";
import { categories, popularSearches } from "@/lib/categories";

/** Search is never cached — every search asks Unsplash fresh. */
export const dynamic = "force-dynamic";

interface PageProps {
    params: Promise<{ query: string }>;
}

function decode(raw: string): string {
    try {
        return decodeURIComponent(raw);
    } catch {
        return raw;
    }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const term = decode((await params).query);

    return {
        title: `${term} — free stock photos`,
        description: `Free ${term} photos, downloadable at any size. Browse royalty-free ${term} images on Imagisum.`,
        alternates: { canonical: `/search/${encodeURIComponent(term)}` }
    };
}

const SearchPage = async ({ params }: PageProps) => {
    const term = decode((await params).query).trim();

    let initial = emptyPage();
    let problem: string | null = null;

    try {
        initial = await getSearchPhotos(term);
    } catch (error) {
        problem = describeError(error, "search");
    }

    const related = categories
        .filter((category) => category.name.toLowerCase() !== term.toLowerCase())
        .slice(0, 8);

    const total = initial.totalResults;

    return (
        <Container className="py-8 md:py-12">
            <PageHeader
                breadcrumbs={[{ label: "Home", href: "/" }, { label: "Search" }, { label: term }]}
                title={
                    <span className="flex flex-wrap items-baseline gap-2">
                        <span className="capitalize">{term}</span>
                        <span className="text-base font-normal text-fg-subtle">photos</span>
                    </span>
                }
                meta={
                    total !== null && total > 0 ? (
                        <span className="inline-flex items-center gap-1.5">
                            <IconSearch size={15} />
                            {total.toLocaleString()} free photos found
                        </span>
                    ) : undefined
                }
            />

            {problem && (
                <div className="mt-6">
                    <Notice>{problem}</Notice>
                </div>
            )}

            <div className="mt-8">
                <PhotoGrid
                    initial={initial}
                    endpoint={`/api/photos?${new URLSearchParams({ query: term }).toString()}`}
                    emptyTitle={`No results for “${term}”`}
                    emptyDescription="Check the spelling, or try one of the searches below."
                    emptyAction={
                        <div className="flex flex-wrap justify-center gap-2">
                            {popularSearches.slice(0, 6).map((suggestion) => (
                                <Chip key={suggestion} href={`/search/${encodeURIComponent(suggestion)}`}>
                                    {suggestion}
                                </Chip>
                            ))}
                        </div>
                    }
                />
            </div>

            <section className="mt-12 border-t border-border pt-8">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-fg-subtle">Browse categories</h2>
                <div className="mt-4 flex flex-wrap gap-2">
                    {related.map((category) => (
                        <Link
                            key={category.slug}
                            href={`/discover/${category.slug}`}
                            className="rounded-full border border-border px-4 py-2 text-sm text-fg-muted transition-colors hover:border-border-strong hover:text-fg"
                        >
                            {category.name}
                        </Link>
                    ))}
                </div>
            </section>
        </Container>
    );
};

export default SearchPage;
