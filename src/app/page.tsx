import Link from "next/link";
import { IconArrowRight, IconBolt, IconCrop, IconLink } from "@tabler/icons-react";

import Container from "@/components/ui/Container";
import Hero from "@/components/home/Hero";
import CategoryRail from "@/components/home/CategoryRail";
import PhotoGrid from "@/components/photo/PhotoGrid";
import { emptyPage, getHomeFeed } from "@/lib/photos";
import { getRandomPicsum } from "@/lib/picsum";

/**
 * Rendered per request so the hero changes on every visit — which is free:
 * the hero comes from Picsum (no limit), and the feed from Unsplash is cached
 * for an hour, so a visit costs no quota at all.
 */
export const dynamic = "force-dynamic";

/** Used only if Picsum is unreachable. */
const heroImages = [
    "/hero/i-1.jpg", "/hero/i-2.jpg", "/hero/i-3.jpg", "/hero/i-4.jpg", "/hero/i-5.jpg",
    "/hero/i-6.jpg", "/hero/i-7.jpg", "/hero/i-8.jpg", "/hero/i-9.jpg", "/hero/i-10.jpg",
    "/hero/i-11.jpg", "/hero/i-12.jpg", "/hero/i-13.jpg", "/hero/i-14.jpg", "/hero/i-15.jpg"
];

const features = [
    {
        icon: IconCrop,
        title: "Any size you need",
        body: "Pick a preset or type exact pixels, then drag to choose what stays in frame."
    },
    {
        icon: IconLink,
        title: "Hotlink or download",
        body: "Every photo gets a stable URL you can drop straight into an <img> tag, or download as a file."
    },
    {
        icon: IconBolt,
        title: "Random placeholders",
        body: "Need filler? /image?random=1&width=800&height=600 returns a fresh photo on every request."
    }
];

const Page = async () => {
    const fallbackSrc = heroImages[Math.floor(Math.random() * heroImages.length)];

    const [initial, heroPhoto] = await Promise.all([
        getHomeFeed().catch(() => emptyPage()),
        getRandomPicsum()
    ]);

    return (
        <>
            <Hero photo={heroPhoto} fallbackSrc={fallbackSrc} />

            <Container className="pt-10">
                <CategoryRail />
            </Container>

            <Container className="pt-10">
                <div className="mb-6">
                    <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">Curated for you</h2>
                    <p className="mt-1.5 text-sm text-fg-muted">Fresh picks from the Unsplash editorial feed.</p>
                </div>

                <PhotoGrid
                    initial={initial}
                    endpoint="/api/photos"
                    emptyTitle="Nothing to show yet"
                    emptyDescription="The curated feed is unavailable right now. Try a search or come back shortly."
                />
            </Container>

            <Container className="mt-6">
                <section className="overflow-hidden rounded-3xl border border-border bg-bg-subtle p-8 md:p-12">
                    <div className="max-w-2xl">
                        <span className="text-xs font-semibold uppercase tracking-wider text-brand">
                            For developers
                        </span>
                        <h2 className="mt-3 text-2xl font-semibold tracking-tight md:text-3xl">
                            Placeholder images without the placeholder look
                        </h2>
                        <p className="mt-3 text-base text-fg-muted">
                            Imagisum turns any photo into a resizable URL. Point an{" "}
                            <code className="rounded-md bg-bg-inset px-1.5 py-0.5 font-mono text-sm">img</code> tag at
                            it and you get a real photograph at exactly the dimensions your layout expects.
                        </p>
                    </div>

                    <div className="mt-8 grid gap-6 md:grid-cols-3">
                        {features.map((feature) => (
                            <div key={feature.title}>
                                <div className="flex size-10 items-center justify-center rounded-xl bg-brand-soft text-brand">
                                    <feature.icon size={20} />
                                </div>
                                <h3 className="mt-3.5 font-semibold tracking-tight">{feature.title}</h3>
                                <p className="mt-1.5 text-sm leading-relaxed text-fg-muted">{feature.body}</p>
                            </div>
                        ))}
                    </div>

                    <Link
                        href="/docs"
                        className="mt-8 inline-flex h-11 items-center gap-2 rounded-xl bg-brand px-5 text-sm font-semibold text-brand-fg transition-colors hover:bg-brand-hover"
                    >
                        Read the API docs
                        <IconArrowRight size={17} />
                    </Link>
                </section>
            </Container>
        </>
    );
};

export default Page;
