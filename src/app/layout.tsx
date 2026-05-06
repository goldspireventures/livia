import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { Suspense } from "react";

import { HeaderAuth } from "@/components/HeaderAuth";
import { HeaderDashboardLink } from "@/components/HeaderDashboardLink";

import "@/styles/globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Livia",
  description: "Appointments for service businesses",
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
      <body className="flex min-h-full flex-col bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
        <ClerkProvider>
          <header className="flex items-center justify-end gap-3 border-b border-zinc-200 px-4 py-2 dark:border-zinc-800">
            <div className="mr-auto flex items-center gap-4">
              <Link href="/" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Livia
              </Link>
              <Link
                href="/b"
                className="text-sm font-medium text-zinc-600 underline-offset-4 hover:underline dark:text-zinc-400"
              >
                Workspace
              </Link>
            </div>
            <Suspense fallback={
              <Link
                href="/dashboard"
                className="text-sm text-zinc-600 underline-offset-4 hover:underline dark:text-zinc-400"
              >
                Dashboard
              </Link>
            }>
              <HeaderDashboardLink />
            </Suspense>
            <HeaderAuth />
          </header>
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}
