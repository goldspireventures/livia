import { motion } from "framer-motion";
import { editorialCopy, type MarketingLocale } from "@/lib/marketing-editorial-i18n";

const base = import.meta.env.BASE_URL;

type EditorialStoryProps = {
  locale: MarketingLocale;
};

export function EditorialStory({ locale }: EditorialStoryProps) {
  const t = editorialCopy(locale).story;

  return (
    <>
      <div className="h-12 sm:h-16 md:h-24" aria-hidden />

      <section className="py-16 sm:py-20 md:py-28 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <p className="text-[11px] font-medium tracking-[0.22em] uppercase text-muted-foreground mb-8 sm:mb-10">
            {t.chapter1}
          </p>

          <div className="grid md:grid-cols-[1fr_1.15fr] gap-10 md:gap-16 items-start">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl tracking-tight leading-tight mb-5 sm:mb-6 max-w-md">
                {t.inboxTitle}
              </h2>
              <p className="editorial-measure text-muted-foreground leading-relaxed">{t.inboxBody}</p>
            </motion.div>

            <motion.figure
              className="md:-mt-6"
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.1 }}
            >
              <div className="relative -rotate-1 md:-rotate-2 ml-auto max-w-md">
                <div className="rounded-sm border border-white/10 bg-[#0c0c0e] p-4 sm:p-5 shadow-xl shadow-black/40">
                  <p className="font-mono text-[10px] text-muted-foreground mb-3 sm:mb-4">{t.smsTime}</p>
                  <p className="text-sm text-white/80 mb-3">{t.smsCustomer}</p>
                  <p className="text-sm text-white/90 pl-3 border-l border-aurora-cyan/50">
                    <span className="font-serif italic text-aurum-champagne/90">Liv</span> {t.smsLiv}
                  </p>
                  <p className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-medium text-aurora-violet">
                    <span className="w-1 h-1 rounded-full bg-aurora-violet" />
                    {t.livReplied}
                  </p>
                </div>
              </div>
            </motion.figure>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20 md:py-24 px-4 sm:px-6 bg-aurum-cream text-aurum-ink">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-[0.55fr_0.45fr] gap-8 sm:gap-10 items-center">
          <div>
            <p className="text-[11px] font-medium tracking-[0.22em] uppercase text-aurum-bronze mb-5 sm:mb-6">
              {t.chapter2}
            </p>
            <h2 className="font-serif text-2xl sm:text-3xl md:text-[2.5rem] tracking-tight leading-tight text-aurum-ink mb-4">
              {t.creamTitle}
            </h2>
            <p className="max-w-md text-aurum-bronze leading-relaxed text-base sm:text-[1.05rem]">{t.creamBody}</p>
          </div>
          <p className="font-serif text-lg sm:text-xl md:text-2xl italic text-aurum-bronze/90 lg:text-right lg:pl-8">
            {t.creamAside}
          </p>
        </div>
      </section>

      <section className="py-16 sm:py-20 md:py-28 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <p className="text-[11px] font-medium tracking-[0.22em] uppercase text-muted-foreground mb-6 sm:mb-8">
            {t.chapter3}
          </p>
          <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl tracking-tight mb-10 sm:mb-12 max-w-xl">
            {t.cockpitTitle}
          </h2>

          <motion.div
            className="relative max-w-4xl"
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.9 }}
          >
            <div className="relative rotate-[0.75deg] md:rotate-1">
              <div className="rounded-sm overflow-hidden border border-white/10 shadow-2xl shadow-black/60 bg-[#09090b]">
                <div className="aspect-[16/10] relative min-h-[200px]">
                  <img
                    src={`${base}hero-salon-morning.png`}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover opacity-25 blur-sm scale-110"
                    aria-hidden
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-[#09090b]/85" />
                  <div className="relative p-6 sm:p-8 md:p-12 flex flex-col justify-center h-full">
                    <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-4 sm:mb-6">
                      {t.cockpitLabel}
                    </p>
                    <p className="font-serif text-xl sm:text-2xl md:text-3xl text-white/90 max-w-lg leading-snug">
                      {t.cockpitBody}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <p className="mt-4 font-mono text-[11px] text-muted-foreground/70">{t.cockpitNote}</p>
          </motion.div>
        </div>
      </section>

      <section className="py-16 sm:py-20 md:py-28 px-4 sm:px-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <p className="font-serif italic text-aurum-champagne text-lg mb-3">{t.trustIntro}</p>
          <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl tracking-tight mb-12 sm:mb-16 max-w-2xl">
            {t.trustTitle}
          </h2>

          <ol className="relative border-l border-white/10 ml-2 space-y-0">
            {t.trustSteps.map((step, i) => (
              <motion.li
                key={step.when}
                className="relative pl-7 sm:pl-8 md:pl-10 py-5 sm:py-6 md:py-7"
                initial={{ opacity: 0, x: -8 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.06 }}
              >
                <span
                  className="absolute left-0 top-7 sm:top-8 md:top-9 -translate-x-1/2 w-2 h-2 rounded-full bg-aurora-cyan"
                  aria-hidden
                />
                <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground mb-1">
                  {step.when}
                </p>
                <p className="text-base md:text-lg text-white/85 max-w-xl">{step.what}</p>
              </motion.li>
            ))}
          </ol>
        </div>
      </section>
    </>
  );
}
