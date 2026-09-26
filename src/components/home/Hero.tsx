import Link from "next/link";

import Container from "../ui/Container";
import SearchBar from "../search/SearchBar";
import { popularSearches } from "@/lib/categories";
import { HEADER_HEIGHT } from "@/lib/constants";
import { Photo } from "@/_types";

interface Props {
    /** Random Picsum shot; falls back to a bundled image when Picsum is down. */
    photo: Photo | null;
    fallbackSrc: string;
}

const Hero = ({ photo, fallbackSrc }: Props) => (
    // No overflow-hidden here: the search suggestions drop past the section edge.
    <section
        className="relative flex min-h-[540px] items-center md:min-h-[620px]"
        style={{ paddingTop: HEADER_HEIGHT }}
    >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
            src={photo?.preview || fallbackSrc}
            alt=""
            fetchPriority="high"
            className="absolute inset-0 size-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-linear-to-b from-black/70 via-black/45 to-black/70" />

        <Container className="relative py-16 md:py-24">
            <div className="max-w-3xl">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-medium text-white/90 backdrop-blur">
                    Lorem Ipsum — but for photos
                </span>
                <h1 className="mt-5 text-3xl font-semibold leading-[1.1] tracking-tight text-white sm:text-4xl md:text-5xl lg:text-[3.4rem]">
                    The best free stock photos, resized to fit your layout
                </h1>
                <p className="mt-4 max-w-xl text-base text-white/75 md:text-lg">
                    Search millions of royalty-free images, pick any dimensions you need, then copy the URL straight
                    into your markup or download the file.
                </p>

                <div className="mt-8 max-w-2xl">
                    <SearchBar variant="hero" placeholder="Search for free photos — try “mountains”" />
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-2">
                    <span className="text-sm text-white/60">Trending:</span>
                    {popularSearches.slice(0, 6).map((term) => (
                        <Link
                            key={term}
                            href={`/search/${encodeURIComponent(term)}`}
                            className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-sm text-white/85 backdrop-blur transition-colors hover:border-white/40 hover:bg-white/20 hover:text-white"
                        >
                            {term}
                        </Link>
                    ))}
                </div>
            </div>
        </Container>

        {photo && (
            <div className="absolute bottom-4 right-4 hidden items-center gap-1.5 rounded-full bg-black/35 px-3 py-1.5 text-xs text-white/70 backdrop-blur sm:flex">
                Photo by
                <Link
                    href={photo.pageUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-white transition-opacity hover:opacity-80"
                >
                    {photo.photographer}
                </Link>
                on
                <Link
                    href="https://unsplash.com/?utm_source=imagisum&utm_medium=referral"
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-white transition-opacity hover:opacity-80"
                >
                    Unsplash
                </Link>
            </div>
        )}
    </section>
);

export default Hero;
