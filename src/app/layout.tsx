import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { AppProgressBar } from "@siamf/next-progress";

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/constants";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], display: "swap", variable: "--font-inter" });

export const metadata: Metadata = {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://imagisum.vercel.app"),
    title: {
        default: `${SITE_NAME} — Free stock photos at any size`,
        template: `%s · ${SITE_NAME}`
    },
    description: SITE_DESCRIPTION,
    keywords: [
        "free stock photos",
        "royalty free images",
        "placeholder images",
        "lorem ipsum images",
        "image resizer",
        "unsplash"
    ],
    openGraph: {
        type: "website",
        siteName: SITE_NAME,
        title: `${SITE_NAME} — Free stock photos at any size`,
        description: SITE_DESCRIPTION
    },
    twitter: {
        card: "summary_large_image",
        title: `${SITE_NAME} — Free stock photos at any size`,
        description: SITE_DESCRIPTION
    }
};

export const viewport: Viewport = {
    themeColor: "#ffffff",
    colorScheme: "light"
};

const RootLayout = ({ children }: Readonly<{ children: React.ReactNode }>) => {
    return (
        <html lang="en">
            <body className={`${inter.className} min-h-screen bg-bg text-fg antialiased`}>
                <AppProgressBar
                    color="var(--brand)"
                    delay={300}
                    height={5}
                    showSpinner={false}
                    zIndex={99999999999999}
                />
                <Header />
                <main>{children}</main>
                <Footer />
            </body>
        </html>
    );
};

export default RootLayout;
