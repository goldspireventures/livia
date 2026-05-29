import { Link } from "wouter";
import { ArrowRight } from "lucide-react";
import { LiviaWordmark } from "@/components/brand/LiviaMark";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background text-foreground editorial-grain flex flex-col px-4 sm:px-6 pt-[calc(4rem+env(safe-area-inset-top))] pb-[env(safe-area-inset-bottom)]">
      <div className="pointer-events-none absolute top-0 left-0 w-[min(480px,80vw)] h-[min(480px,50vh)]" aria-hidden>
        <div className="absolute top-1/4 left-0 w-full h-full bg-aurora-cyan/10 rounded-full blur-[100px]" />
      </div>

      <header className="relative z-10 mb-16">
        <Link href="/">
          <LiviaWordmark size="md" />
        </Link>
      </header>

      <main className="relative z-10 flex-1 flex flex-col justify-center max-w-lg">
        <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground mb-4">404</p>
        <h1 className="font-serif text-4xl sm:text-5xl tracking-tight leading-tight mb-4">
          This page
          <span className="block text-white/80">isn&apos;t here.</span>
        </h1>
        <p className="editorial-measure text-muted-foreground mb-10">
          The link may be old, or we moved things during the closed beta.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-aurora-cyan font-medium min-h-[44px] hover:text-white transition-colors"
        >
          Back to home
          <ArrowRight className="w-4 h-4" />
        </Link>
      </main>
    </div>
  );
}
