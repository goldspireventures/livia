import { motion } from "framer-motion";
import { Link } from "wouter";
import { ArrowRight } from "lucide-react";
import { editorialCopy, type MarketingLocale } from "@/lib/marketing-editorial-i18n";

const base = import.meta.env.BASE_URL;

type EditorialHeroProps = {
  locale: MarketingLocale;
  onMeetLiv: (e: React.MouseEvent) => void;
};

export function EditorialHero({ locale, onMeetLiv }: EditorialHeroProps) {
  const copy = editorialCopy(locale);
  const t = copy.hero;

  return (
    <section className="relative min-h-[min(88vh,900px)] lg:min-h-[92vh] flex items-end lg:items-center pt-[calc(5.5rem+env(safe-area-inset-top))] pb-12 sm:pb-16 lg:pb-24 px-4 sm:px-6 editorial-grain overflow-hidden">
      <div
        className="pointer-events-none absolute top-0 left-0 w-[min(720px,90vw)] h-[min(720px,70vh)]"
        aria-hidden
      >
        <div className="absolute top-1/4 left-0 w-full h-full bg-aurora-cyan/12 rounded-full blur-[120px] mix-blend-screen" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto w-full grid lg:grid-cols-[1.05fr_0.95fr] gap-8 sm:gap-10 lg:gap-6 items-end">
        <div className="lg:pr-8 lg:-mr-12 z-20 order-2 lg:order-1">
          <motion.p
            className="text-[11px] font-medium tracking-[0.2em] uppercase text-muted-foreground mb-6 sm:mb-8"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            {t.eyebrow}
          </motion.p>

          <motion.h1
            className="font-serif text-[2.1rem] sm:text-5xl md:text-[3.25rem] lg:text-[3.5rem] leading-[1.08] tracking-tight mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
          >
            {t.headline.map((line, i) => (
              <span key={line} className={`block ${i === 2 ? "text-white/85" : ""}`}>
                {line}
              </span>
            ))}
          </motion.h1>

          <div className="h-px w-16 bg-aurora-cyan/70 mb-6" aria-hidden />

          <motion.p
            className="text-lg sm:text-xl md:text-2xl text-white/55 italic font-serif mb-6"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
          >
            {t.livLine.includes("Liv") ? (
              <>
                {t.livLine.split("Liv")[0]}
                <span className="text-aurum-champagne not-italic">Liv</span>
                {t.livLine.split("Liv")[1]}
              </>
            ) : (
              t.livLine
            )}
          </motion.p>

          <motion.p
            className="editorial-measure text-muted-foreground text-base md:text-[1.05rem] leading-relaxed mb-6 sm:mb-8"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.18, ease: [0.16, 1, 0.3, 1] }}
          >
            {t.body}
          </motion.p>

          <motion.p
            className="editorial-measure text-muted-foreground/80 text-sm mb-8 sm:mb-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.22 }}
          >
            {t.regions}
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-4 sm:gap-6"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.28, ease: [0.16, 1, 0.3, 1] }}
          >
            <button
              type="button"
              onClick={onMeetLiv}
              className="group inline-flex items-center justify-center gap-2 text-aurora-cyan font-medium text-base hover:text-white transition-colors min-h-[44px]"
              data-testid="editorial-hero-cta"
            >
              {t.meetLiv}
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </button>
            <Link
              href="/how-it-works"
              className="text-sm text-muted-foreground hover:text-white transition-colors min-h-[44px] inline-flex items-center"
            >
              {t.howItWorks}
            </Link>
          </motion.div>
        </div>

        <motion.figure
          className="relative lg:-ml-8 order-1 lg:order-2 w-full"
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="relative aspect-[4/5] sm:aspect-[5/6] lg:aspect-[4/5] max-h-[min(52vh,420px)] sm:max-h-[min(60vh,520px)] lg:max-h-[min(72vh,640px)] mx-auto lg:mx-0 w-full max-w-sm sm:max-w-md lg:max-w-none overflow-hidden rounded-sm">
            <img
              src={`${base}hero-salon-morning.png`}
              alt={t.photoAlt}
              className="absolute inset-0 w-full h-full object-cover object-center scale-[1.02]"
              loading="eager"
              fetchPriority="high"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/25 to-transparent lg:bg-gradient-to-l lg:from-background lg:via-background/30 lg:to-transparent" />
          </div>
          <figcaption className="mt-3 font-mono text-[11px] tracking-wide text-muted-foreground/80 text-center lg:text-left lg:pl-1">
            {t.photoCaption}
          </figcaption>
        </motion.figure>
      </div>
    </section>
  );
}
