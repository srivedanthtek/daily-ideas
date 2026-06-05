import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import { isAuthenticated, logout } from "@/lib/auth";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "✦ Spark",
  description: "Private Daily Idea Journal",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const authenticated = await isAuthenticated();

  async function handleLogout() {
    "use server";
    await logout();
  }

  return (
    <html lang="en" className={`${inter.variable}`}>
      <body className="bg-[#ffffff] text-[#1a1a1a] font-sans antialiased min-h-screen flex flex-col selection:bg-neutral-100">
        <header className="border-b border-neutral-100 py-5 sticky top-0 bg-white/80 backdrop-blur-md z-50">
          <div className="max-w-[1192px] mx-auto px-6 flex justify-between items-center">
            <Link href="/" className="font-sans font-bold text-xl tracking-tight flex items-center gap-2 hover:opacity-80 transition-opacity">
              <span className="text-xl text-[#1a1a1a]">✦</span> 
              <span className="text-black font-semibold">Spark</span>
            </Link>
            <nav className="flex items-center gap-6 text-sm font-medium">
              <Link href="/" className="text-[#1a1a1a] hover:text-black transition-colors">
                Latest
              </Link>
              <Link href="/archive" className="text-neutral-500 hover:text-black transition-colors">
                Archive
              </Link>
              {authenticated ? (
                <form action={handleLogout} className="inline m-0">
                  <button type="submit" className="text-red-500 hover:text-red-700 font-medium transition-colors text-sm">
                    Sign Out
                  </button>
                </form>
              ) : (
                <Link href="/login" className="bg-black text-white hover:bg-neutral-800 transition-colors px-3.5 py-1.5 rounded-full text-xs font-semibold">
                  Sign In
                </Link>
              )}
            </nav>
          </div>
        </header>

        <main className="flex-1 flex flex-col">
          {children}
        </main>

        <footer className="border-t border-neutral-100 py-10 mt-auto text-center text-xs text-neutral-400">
          <div className="max-w-[1192px] mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div>
              Generated daily by Claude &middot; <a href="https://spark.srivedanthtek.com" className="hover:underline font-medium text-neutral-500">spark.srivedanthtek.com</a>
            </div>
            <div className="text-neutral-400">
              &copy; {new Date().getFullYear()} Spark. All rights reserved.
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}