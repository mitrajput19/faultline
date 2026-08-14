import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import "./globals.css";

// Variable font: one file covers the 400/500/700 weights the design system uses.
const inter = Inter({ subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: "Faultline",
  description: "Dependency blast-radius for incident response.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.className}>
      <body className="min-h-screen">
        <header className="border-b border-hairline bg-surface">
          <div className="mx-auto flex max-w-7xl items-baseline justify-between gap-6 px-4 py-6 sm:px-6">
            <Link
              href="/"
              className="text-heading-md font-bold text-ink rounded-sharp"
            >
              Faultline
            </Link>
            <p className="hidden text-caption-sm text-subtle sm:block">
              Dependency blast-radius for incident response
            </p>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
          {children}
        </main>

        <footer className="mx-auto max-w-7xl px-4 pb-12 text-caption-sm text-subtle sm:px-6">
          Graph data served from CognoDB over Bolt.
        </footer>
      </body>
    </html>
  );
}
