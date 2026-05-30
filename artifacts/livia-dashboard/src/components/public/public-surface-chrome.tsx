import { Loader2 } from "lucide-react";
import { LiviaWordmark } from "@/components/brand/LiviaMark";
import { getMarketingOrigin } from "@/lib/surface-urls";

/** Shared loading / error chrome for B2C public surfaces (/b, /visit, /p). */
export function PublicSurfaceHalo() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div className="absolute left-0 top-0 h-[min(420px,50vh)] w-[min(420px,80vw)] bg-aurora-cyan/8 rounded-full blur-[100px]" />
    </div>
  );
}

export function PublicSurfaceLoading() {
  return (
    <div className="relative min-h-screen bg-background flex items-center justify-center px-4">
      <PublicSurfaceHalo />
      <Loader2 className="relative z-10 h-8 w-8 animate-spin text-primary" aria-label="Loading" />
    </div>
  );
}

export function PublicSurfaceNotFound({
  code = "404",
  title,
  detail,
}: {
  code?: string;
  title: string;
  detail: string;
}) {
  return (
    <div className="relative min-h-screen bg-background flex flex-col px-4 sm:px-6 py-10">
      <PublicSurfaceHalo />
      <header className="relative z-10 mb-12">
        <a href={getMarketingOrigin()} className="inline-block opacity-80 hover:opacity-100">
          <LiviaWordmark size="sm" />
        </a>
      </header>
      <main className="relative z-10 flex-1 flex flex-col justify-center max-w-md pb-16">
        <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground mb-3">
          {code}
        </p>
        <h1 className="font-serif text-3xl tracking-tight leading-tight mb-2">{title}</h1>
        <p className="text-muted-foreground text-sm mb-6 leading-relaxed">{detail}</p>
        <a href={getMarketingOrigin()} className="text-aurora-cyan text-sm font-medium hover:text-white min-h-[44px] inline-flex items-center">
          {getMarketingOrigin().replace(/^https?:\/\//, "")} →
        </a>
      </main>
    </div>
  );
}

export function PublicSurfaceFooter() {
  return (
    <footer className="mt-16 pt-8 border-t border-border/40 pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <a href={getMarketingOrigin()} className="opacity-70 hover:opacity-100 transition-opacity">
          <LiviaWordmark size="sm" />
        </a>
        <p className="text-[11px] text-muted-foreground font-mono">
          Bookings powered by{" "}
          <a
            href={getMarketingOrigin()}
            className="font-medium text-foreground underline underline-offset-2 hover:text-aurora-cyan"
          >
            Livia
          </a>
        </p>
      </div>
    </footer>
  );
}
