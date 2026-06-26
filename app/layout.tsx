import type { Metadata } from "next";
import { Anton, Baloo_2, Hanken_Grotesk } from "next/font/google";
import "./globals.css";
import SmoothScroll from "@/components/SmoothScroll";
import CustomCursor from "@/components/CustomCursor";
import PageTransition from "@/components/PageTransition";

const anton = Anton({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-anton",
  display: "swap",
});

const baloo = Baloo_2({
  weight: ["500", "600", "700", "800"],
  subsets: ["latin"],
  variable: "--font-baloo",
  display: "swap",
});

const hanken = Hanken_Grotesk({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-hanken",
  display: "swap",
});

const OG_IMAGE = "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200&q=80";

export const metadata: Metadata = {
  title: "Veycho — Resto-Cafe · Wayanad",
  description:
    "Authentic Wayanadan flavours. Resto-Cafe since 2020 in Kalpetta, Kerala. Walk-ins welcome 11am–10pm.",
  openGraph: {
    title: "Veycho — Resto-Cafe · Wayanad",
    description:
      "Authentic Wayanadan flavours. Resto-Cafe since 2020 in Kalpetta, Kerala. Walk-ins welcome 11am–10pm.",
    siteName: "Veycho Resto-Cafe",
    locale: "en_IN",
    type: "website",
    images: [{ url: OG_IMAGE, width: 1200, height: 800, alt: "Veycho Resto-Cafe — Wayanad" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Veycho — Resto-Cafe · Wayanad",
    description: "Authentic Wayanadan flavours in Kalpetta, Kerala. Walk-ins welcome 11am–10pm.",
    images: [OG_IMAGE],
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
      className={`${anton.variable} ${baloo.variable} ${hanken.variable}`}
      suppressHydrationWarning
    >
      <body>
        <SmoothScroll />
        <CustomCursor />
        <PageTransition>{children}</PageTransition>
      </body>
    </html>
  );
}
