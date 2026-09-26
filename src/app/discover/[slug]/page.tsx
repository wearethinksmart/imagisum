import type { Metadata } from "next";
import { notFound } from "next/navigation";

import Container from "@/components/ui/Container";
import PageHeader from "@/components/ui/PageHeader";
import PhotoGrid from "@/components/photo/PhotoGrid";
import CategoryRail from "@/components/home/CategoryRail";
import Notice from "@/components/ui/Notice";
import { getCategory } from "@/lib/categories";
import { emptyPage, getCategoryPhotos } from "@/lib/photos";
import { describeError } from "@/lib/unsplash";

/**
 * Categories are fixed queries, so the page and its listing keep for an hour.
 * Not prerendered at build: that would spend a request per category on every
 * deploy. Each one renders on its first visit and is cached from then on.
 */
export const revalidate = 3600;

interface PageProps {
    params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const category = getCategory((await params).slug);
    if (!category) return { title: "Category not found" };

    return {
        title: `${category.name} photos`,
        description: `${category.description} Free ${category.name.toLowerCase()} stock photos, downloadable at any size.`,
        alternates: { canonical: `/discover/${category.slug}` }
    };
}

const CategoryPage = async ({ params }: PageProps) => {
    const category = getCategory((await params).slug);
    if (!category) notFound();

    let initial = emptyPage();
    let problem: string | null = null;

    try {
        initial = await getCategoryPhotos(category.query);
    } catch (error) {
        problem = describeError(error, "category");
    }

    return (
        <Container className="py-8 md:py-12">
            <PageHeader
                breadcrumbs={[{ label: "Home", href: "/" }, { label: category.name }]}
                title={`${category.name} photos`}
                description={category.description}
                meta={
                    initial.totalResults ? (
                        <span>{initial.totalResults.toLocaleString()} free photos</span>
                    ) : undefined
                }
            />

            <div className="mt-8">
                <CategoryRail activeSlug={category.slug} />
            </div>

            {problem && (
                <div className="mt-6">
                    <Notice>{problem}</Notice>
                </div>
            )}

            <div className="mt-8">
                <PhotoGrid
                    initial={initial}
                    endpoint={`/api/photos?category=${category.slug}`}
                    emptyTitle={`No ${category.name.toLowerCase()} photos right now`}
                    emptyDescription="Try again shortly, or search for something specific."
                />
            </div>
        </Container>
    );
};

export default CategoryPage;
