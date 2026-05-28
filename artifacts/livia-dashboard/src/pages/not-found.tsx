import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { LiviaWordmark } from "@/components/brand/LiviaMark";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="relative min-h-[100dvh] w-full flex flex-col bg-background text-foreground px-4 sm:px-6">
      <div className="pointer-events-none absolute top-0 left-0 w-[480px] h-[480px]" aria-hidden>
        <div className="absolute top-1/4 left-0 w-full h-full bg-aurora-cyan/10 rounded-full blur-[120px]" />
      </div>

      <header className="relative z-10 py-6">
        <LiviaWordmark size="md" />
      </header>

      <main className="relative z-10 flex flex-1 flex-col justify-center max-w-md pb-16">
        <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground mb-4">404</p>
        <h1 className="font-serif text-4xl tracking-tight leading-tight mb-4">
          That page
          <span className="block text-muted-foreground italic">slipped past us.</span>
        </h1>
        <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
          Head back to your cockpit and try again.
        </p>
        <Link href="/">
          <Button variant="outline" size="sm" className="min-h-[44px]">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to dashboard
          </Button>
        </Link>
      </main>
    </div>
  );
}
