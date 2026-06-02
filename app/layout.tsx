import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "✦ Spark",
  description: "Private Daily Idea Journal",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable}`}>
      <body className="bg-[#ffffff] text-[#1a1a1a] font-sans antialiased min-h-screen flex flex-col selection:bg-gray-100">
        <header className="border-b border-gray-100 py-6">
          <div className="max-w-[680px] mx-auto px-4 flex justify-between items-center">
            <Link href="/" className="font-sans font-bold text-xl tracking-tight flex items-center gap-1.5 hover:opacity-80 transition-opacity">
              <span>✦</span> Spark
            </Link>
            <nav className="flex gap-6 text-sm font-medium">
              <Link href="/" className="text-[#1a1a1a] hover:opacity-80 transition-opacity">
                Latest
              </Link>
              <Link href="/archive" className="text-[#6b7280] hover:text-[#1a1a1a] transition-colors">
                Archive
              </Link>
            </nav>
          </div>
        </header>

        <main className="flex-1 max-w-[680px] w-full mx-auto px-4 py-12">
          {children}
        </main>

        <footer className="border-t border-gray-100 py-8 mt-20 text-center text-xs text-[#6b7280]">
          <div className="max-w-[680px] mx-auto px-4">
            Generated daily by Claude &middot; <a href="https://spark.srivedanthtek.com" className="hover:underline">spark.srivedanthtek.com</a>
          </div>
        </footer>
      </body>
    </html>
  );
}