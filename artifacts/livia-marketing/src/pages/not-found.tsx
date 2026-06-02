import { Link } from "wouter";
import { ArrowRight } from "lucide-react";
import { LiviaWordmark } from "@/components/brand/LiviaMark";
import { ConstellationPageShell } from "@/components/constellation/constellation-page-shell";

import { MarketingSkipLink } from "@/components/marketing-skip-link";

export default function NotFound() {
  return (
    <div className="marketing-w1-shell min-h-screen bg-background text-foreground overflow-x-hidden">
      <MarketingSkipLink />
      <nav className="marketing-w1-nav fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-background/80 backdrop-blur-md pt-[env(safe-area-inset-top)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
          <Link href="/">
            <LiviaWordmark size="md" />
          </Link>
        </div>
      </nav>
      <main id="main-content" className="pt-[calc(5rem+env(safe-area-inset-top))] min-h-[80vh] flex flex-col">
        <ConstellationPageShell tone="strong">
          <header className="cst-page-header max-w-lg mx-auto">
            <p className="cst-page-header__eyebrow">404</p>
            <h1 className="cst-page-header__title">
              This page
              <span className="block">
                isn&apos;t <em>here</em>.
              </span>
            </h1>
            <p className="cst-page-header__sub">
              The link may be old, or we moved things during the closed beta. Head home and pick a path from there.
            </p>
          </header>
          <div className="px-4 sm:px-6 pb-20 max-w-lg mx-auto">
            <Link href="/" className="cst-page-link inline-flex items-center gap-2">
              Back to home
              <ArrowRight className="w-4 h-4" strokeWidth={1.75} />
            </Link>
          </div>
        </ConstellationPageShell>
      </main>
    </div>
  );
}
