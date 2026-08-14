import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

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
    <html lang="en">
      <body className="min-h-screen">
        <header className="sticky top-0 z-10 bg-black text-white">
          <div className="mx-auto flex h-11 max-w-7xl items-center justify-between gap-6 px-5 sm:px-6">
            <Link
              href="/"
              className="rounded-sharp text-[21px] font-semibold tracking-[-0.03em]"
            >
              Faultline
            </Link>
            <p className="hidden text-[12px] tracking-[-0.01em] text-white/70 sm:block">
              Dependency blast-radius for incident response
            </p>
            <span className="rounded-full border border-white/25 px-3 py-1 text-[11px] text-white/80">
              Live dependency map
            </span>
          </div>
        </header>

        <main className="min-h-[calc(100vh-44px)] bg-canvas">
          {children}
        </main>

        <footer className="bg-parchment px-5 py-10 text-caption-sm text-subtle sm:px-6">
          <div className="mx-auto flex max-w-7xl flex-wrap justify-between gap-3 border-t border-hairline pt-5">
            <span>Faultline incident intelligence</span>
            <span>Graph data served from CognoDB over Bolt.</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
