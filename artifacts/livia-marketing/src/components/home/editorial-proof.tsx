import { motion } from "framer-motion";
import { editorialCopy, type MarketingLocale } from "@/lib/marketing-editorial-i18n";

type EditorialProofProps = {
  locale: MarketingLocale;
};

export function EditorialProof({ locale }: EditorialProofProps) {
  const t = editorialCopy(locale).proof;

  return (
    <section className="py-20 sm:py-24 md:py-32 px-4 sm:px-6 border-t border-white/5">
      <div className="max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-[0.9fr_1.1fr] gap-12 lg:gap-20 items-start">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7 }}
          >
            <p className="font-serif text-4xl sm:text-5xl md:text-6xl lg:text-7xl tracking-tight leading-none mb-4">
              {t.statHead}
            </p>
            <p className="editorial-measure text-muted-foreground text-base sm:text-lg leading-relaxed">
              {t.statBody}
            </p>
            <p className="mt-6 sm:mt-8 font-mono text-[11px] tracking-wide text-muted-foreground/60">
              {t.cohort}
            </p>
          </motion.div>

          <div className="flex flex-col gap-8 sm:gap-10 lg:pt-4">
            <motion.blockquote
              className="lg:max-w-[92%] lg:ml-auto border-l-2 border-aurum-champagne/40 pl-5 sm:pl-6"
              initial={{ opacity: 0, x: 16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <p className="font-serif text-xl sm:text-2xl md:text-3xl italic leading-snug text-white/90 mb-4">
                &ldquo;{t.quote}&rdquo;
              </p>
              <footer className="text-sm text-muted-foreground">{t.quoteAttribution}</footer>
            </motion.blockquote>

            <motion.div
              className="w-full max-w-md lg:max-w-lg lg:mr-8 mx-auto lg:mx-0"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className="relative rotate-[1.5deg] shadow-2xl shadow-black/50">
                <div className="rounded-sm border border-white/10 overflow-hidden bg-[#0c0c0e] aspect-[16/10] min-h-[140px]">
                  <div className="p-4 sm:p-5 h-full flex flex-col justify-between">
                    <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                      {t.briefingLabel}
                    </p>
                    <ul className="space-y-2 sm:space-y-3 text-sm text-white/85">
                      {t.briefingItems.map((line, i) => (
                        <li key={line} className="flex gap-2">
                          <span
                            className={`shrink-0 ${
                              i === 0 ? "text-aurora-cyan" : i === 1 ? "text-aurora-violet" : "text-muted-foreground"
                            }`}
                          >
                            —
                          </span>
                          <span>{line}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        <div className="mt-16 sm:mt-20 pt-8 sm:pt-10 border-t border-white/5 flex flex-col sm:flex-row sm:flex-wrap gap-3 sm:gap-x-10 text-sm text-muted-foreground/50 font-medium tracking-wide">
          {t.tags.map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </div>
      </div>
    </section>
  );
}
