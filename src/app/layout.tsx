import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "./auth-dashboard.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#f43f5e",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "Memento Booth | Make a Little Memory Together",
  description:
    "Make a little memory together from any distance with synchronized photos, romantic frames, and browser-first privacy.",
  keywords: ["couple photobooth", "long distance relationship", "remote photobooth", "photo strips", "p2p photobooth"],
  authors: [{ name: "Couple Photobooth Team" }],
  openGraph: {
    title: "Memento Booth | Snap Together From Anywhere",
    description: "A private, synchronized virtual photobooth for long-distance partners.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased selection:bg-rose-200 selection:text-rose-900`}
    >
      <body className="min-h-full flex flex-col bg-[#fff8f8] text-stone-900 dark:bg-[#0c0809] dark:text-stone-100">
        {children}
      </body>
    </html>
  );
}
