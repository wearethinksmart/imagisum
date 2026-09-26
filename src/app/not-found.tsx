import Link from "next/link";
import { IconPhotoOff } from "@tabler/icons-react";

import Container from "@/components/ui/Container";
import Chip from "@/components/ui/Chip";
import { popularSearches } from "@/lib/categories";

const NotFound = () => (
    <Container className="flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-brand-soft text-brand">
            <IconPhotoOff size={30} />
        </div>
        <p className="mt-6 font-mono text-sm text-fg-subtle">404</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">This page doesn&apos;t exist</h1>
        <p className="mt-3 max-w-md text-fg-muted">
            The photo or page you were after may have been removed. Head home, or start from a popular search.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
                href="/"
                className="inline-flex h-11 items-center rounded-xl bg-brand px-5 text-sm font-semibold text-brand-fg transition-colors hover:bg-brand-hover"
            >
                Back to home
            </Link>
        </div>

        <div className="mt-10 flex flex-wrap justify-center gap-2">
            {popularSearches.slice(0, 6).map((term) => (
                <Chip key={term} href={`/search/${encodeURIComponent(term)}`}>
                    {term}
                </Chip>
            ))}
        </div>
    </Container>
);

export default NotFound;
