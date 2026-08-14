import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import "./globals.css";

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
        <header className="border-b border-line">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
            <Link href="/" className="flex items-center gap-3">
              <span
                aria-hidden
                className="block h-5 w-px rotate-12 bg-critical shadow-[0_0_12px] shadow-critical/60"
              />
              <span className="text-lg font-semibold tracking-tight">
                Faultline
              </span>
            </Link>
            <p className="hidden text-sm text-muted sm:block">
              Dependency blast-radius for incident response
            </p>
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-6 py-10">{children}</main>

        <footer className="mx-auto max-w-6xl px-6 pb-10 text-xs text-muted">
          Graph data served from CognoDB over Bolt.
        </footer>
      </body>
    </html>
  );
}
