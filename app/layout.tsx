import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const APP_URL = "https://pretextwall.netlify.app";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: "PretextWall — The Community Tweet Wall",
    template: "%s | PretextWall",
  },
  description:
    "PretextWall is a living wall of community tweets — discover what people are building, thinking, and sharing. Submit your own tweet and join the conversation.",
  keywords: [
    "tweet wall",
    "community tweets",
    "twitter wall",
    "social wall",
    "developer community",
    "PretextWall",
  ],
  authors: [{ name: "Subhadeep Roy", url: "https://x.com/mvp_Subha" }],
  creator: "Subhadeep Roy",
  openGraph: {
    type: "website",
    url: APP_URL,
    siteName: "PretextWall",
    title: "PretextWall — The Community Tweet Wall",
    description:
      "A living wall of community tweets. Discover what people are building, thinking, and sharing — and add your own.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "PretextWall — The Community Tweet Wall",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@mvp_Subha",
    creator: "@mvp_Subha",
    title: "PretextWall — The Community Tweet Wall",
    description:
      "A living wall of community tweets. Discover what people are building, thinking, and sharing — and add your own.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: APP_URL,
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "PretextWall",
  url: APP_URL,
  description:
    "A living wall of community tweets. Discover what people are building, thinking, and sharing.",
  author: {
    "@type": "Person",
    name: "Subhadeep Roy",
    url: "https://x.com/mvp_Subha",
  },
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${APP_URL}/?q={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
