import type { Metadata } from "next";
import Link from "next/link";
import { IconArrowRight, IconInfoCircle } from "@tabler/icons-react";

import Container from "@/components/ui/Container";
import PageHeader from "@/components/ui/PageHeader";
import CodeBlock from "@/components/docs/CodeBlock";

export const metadata: Metadata = {
    title: "Image API",
    description:
        "Serve real stock photos as placeholders. One endpoint, any dimensions, optional random mode — no key required.",
    alternates: { canonical: "/docs" }
};

const params = [
    { name: "id", type: "string", required: "Required*", body: "`u-<id>` for an Unsplash photo, `p-<id>` (or just the number) for a Picsum one. Copy it from any photo's download dialog." },
    { name: "random", type: "0 | 1", required: "Required*", body: "A different photo on every request. Use instead of `id`." },
    { name: "query", type: "string", required: "Optional", body: "Narrows random mode to a subject, e.g. `nature`, `office`." },
    { name: "width", type: "16–6000", required: "Optional", body: "Output width in pixels. Alias: `w`." },
    { name: "height", type: "16–6000", required: "Optional", body: "Output height in pixels. Alias: `h`." },
    { name: "fp-x", type: "0–1", required: "Optional", body: "Horizontal crop anchor, where 0 is the left edge. Applies when both sides are set." },
    { name: "fp-y", type: "0–1", required: "Optional", body: "Vertical crop anchor, where 0 is the top edge. Applies when both sides are set." },
    { name: "format", type: "jpg | png | webp | avif", required: "Optional", body: "Output encoding. Defaults to jpg." },
    { name: "q", type: "1–100", required: "Optional", body: "Quality for lossy formats. Defaults to 80." },
    { name: "blur", type: "0–100", required: "Optional", body: "Blur, for background art and loading states." },
    { name: "grayscale", type: "0 | 1", required: "Optional", body: "Strips all colour." },
    { name: "download", type: "0 | 1", required: "Optional", body: "Sends the file as an attachment so browsers save it." }
];

const Code = ({ children }: { children: string }) => (
    <code className="rounded-md bg-bg-inset px-1.5 py-0.5 font-mono text-sm">{children}</code>
);

const DocsPage = () => (
    <Container className="py-8 md:py-12">
        <PageHeader
            breadcrumbs={[{ label: "Home", href: "/" }, { label: "API" }]}
            title="Image API"
            description="One endpoint that turns any photo into a resizable, hotlinkable URL. No key, no signup — just point an img tag at it."
        />

        <div className="mt-10 max-w-3xl space-y-14">
            <section id="quick-start" className="scroll-mt-24">
                <h2 className="text-2xl font-semibold tracking-tight">Quick start</h2>
                <p className="mt-3 text-fg-muted">
                    Give the route an id and the dimensions you want. Open any photo on the site, set the size, and
                    copy the URL from the dialog.
                </p>
                <CodeBlock
                    className="mt-5"
                    code={`<img src="https://imagisum.vercel.app/image?id=p-237&width=800&height=450" width="800" height="450" alt="" />`}
                />
            </section>

            <section id="parameters" className="scroll-mt-24">
                <h2 className="text-2xl font-semibold tracking-tight">Parameters</h2>
                <p className="mt-3 text-fg-muted">
                    <Code>GET /image</Code>
                </p>

                <div className="mt-5 overflow-x-auto rounded-2xl border border-border">
                    <table className="w-full min-w-[560px] text-left text-sm">
                        <thead className="bg-bg-subtle text-xs uppercase tracking-wider text-fg-subtle">
                            <tr>
                                <th className="px-4 py-3 font-semibold">Param</th>
                                <th className="px-4 py-3 font-semibold">Type</th>
                                <th className="px-4 py-3 font-semibold">Description</th>
                            </tr>
                        </thead>
                        <tbody>
                            {params.map((param) => (
                                <tr key={param.name} className="border-t border-border align-top">
                                    <td className="px-4 py-3">
                                        <span className="font-mono font-semibold text-fg">{param.name}</span>
                                        <span className="mt-1 block text-xs text-fg-subtle">{param.required}</span>
                                    </td>
                                    <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-brand">{param.type}</td>
                                    <td className="px-4 py-3 text-fg-muted">{param.body}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <p className="mt-4 flex items-start gap-2 text-sm text-fg-subtle">
                    <IconInfoCircle size={17} className="mt-0.5 shrink-0" />
                    <span>* Pass either `id` or `random=1` — one of the two is required.</span>
                </p>
            </section>

            <section id="sizes" className="scroll-mt-24">
                <h2 className="text-2xl font-semibold tracking-tight">Sizes &amp; cropping</h2>
                <p className="mt-3 text-fg-muted">
                    Give one side and the other scales to keep the ratio. Give both and the photo is cropped to fill
                    that exact box, centred unless <Code>fp-x</Code> / <Code>fp-y</Code> move the anchor.
                </p>
                <CodeBlock
                    className="mt-5"
                    code={`/image?id=p-237&width=400                        → 400px wide, ratio preserved
/image?id=p-237&width=400&height=400             → square, centred crop
/image?id=p-237&width=1200&height=630&fp-y=0.25  → anchored nearer the top
/image?id=p-237&width=800&format=webp            → WebP`}
                />
                <p className="mt-4 text-sm text-fg-muted">
                    A link to a specific photo never changes, so it is cached for a year — after the first hit it is
                    effectively free.
                </p>
            </section>

            <section id="random" className="scroll-mt-24">
                <h2 className="text-2xl font-semibold tracking-tight">Random images</h2>
                <p className="mt-3 text-fg-muted">
                    Drop the id for a different photo on every request — real photography instead of grey boxes.
                </p>
                <CodeBlock
                    className="mt-5"
                    code={`<img src="/image?random=1&width=600&height=400" alt="" />
<img src="/image?random=1&query=mountains&width=1200&height=630" alt="" />`}
                />
            </section>

            <section id="notes" className="scroll-mt-24">
                <h2 className="text-2xl font-semibold tracking-tight">Notes</h2>
                <ul className="mt-4 space-y-3 text-fg-muted">
                    <li className="flex gap-3">
                        <span className="mt-2 size-1.5 shrink-0 rounded-full bg-brand" />
                        <span>
                            Photos come from Unsplash (directly, and through Lorem Picsum) and are free to use under
                            the{" "}
                            <Link
                                href="https://unsplash.com/license?utm_source=imagisum&utm_medium=referral"
                                target="_blank"
                                rel="noreferrer"
                                className="font-medium text-brand underline underline-offset-2"
                            >
                                Unsplash licence
                            </Link>
                            .
                        </span>
                    </li>
                    <li className="flex gap-3">
                        <span className="mt-2 size-1.5 shrink-0 rounded-full bg-brand" />
                        This is a hobby project, not a CDN. Use it for prototypes, demos and mockups.
                    </li>
                </ul>

                <Link
                    href="/"
                    className="mt-8 inline-flex h-11 items-center gap-2 rounded-xl bg-brand px-5 text-sm font-semibold text-brand-fg transition-colors hover:bg-brand-hover"
                >
                    Start browsing photos
                    <IconArrowRight size={17} />
                </Link>
            </section>
        </div>
    </Container>
);

export default DocsPage;
