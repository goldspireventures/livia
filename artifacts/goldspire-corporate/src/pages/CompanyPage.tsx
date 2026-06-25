import { Link } from "wouter";
import { motion } from "framer-motion";
import { Reveal } from "@/components/Reveal";
import type { PortfolioCompany } from "@/data/portfolio";
import { statusLabel } from "@/lib/motion";

export function CompanyPage({ company }: { company: PortfolioCompany }) {
  return (
    <div className="bg-navy">
      <section className={`relative overflow-hidden bg-gradient-to-br ${company.gradient}`}>
        <div className="mx-auto max-w-7xl px-5 pb-20 pt-32 sm:px-8 lg:px-12">
          <Link href="/portfolio" className="text-sm text-muted hover:text-gold transition-colors">
            ← Portfolio
          </Link>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mt-8 max-w-4xl"
          >
            <p className="text-xs uppercase tracking-widest text-gold">{company.industry}</p>
            <h1 className="heading-display mt-4">{company.name}</h1>
            <p className="mt-4 text-xl text-soft sm:text-2xl">{company.tagline}</p>
            <div className="mt-6 flex flex-wrap gap-2">
              <span className="rounded-full border border-white/15 px-4 py-1.5 text-xs text-muted">
                {company.region === "global" ? "UK, EU & Global" : "Africa"}
              </span>
              <span className="rounded-full border border-white/15 px-4 py-1.5 text-xs text-muted">
                {statusLabel[company.status]}
              </span>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="section-pad bg-rich-black">
        <div className="mx-auto max-w-7xl grid gap-16 lg:grid-cols-2">
          <Reveal>
            <h2 className="text-sm tracking-widest text-gold">THE PROBLEM</h2>
            <p className="mt-4 text-lg leading-relaxed text-muted">{company.problem}</p>
          </Reveal>
          <Reveal delay={0.1}>
            <h2 className="text-sm tracking-widest text-gold">OUR APPROACH</h2>
            <p className="mt-4 text-lg leading-relaxed text-muted">{company.approach}</p>
          </Reveal>
        </div>
      </section>

      <section className="section-pad bg-navy border-t border-white/5">
        <div className="mx-auto max-w-7xl">
          <Reveal>
            <h2 className="heading-section">Vision</h2>
            <p className="mt-6 max-w-3xl text-xl leading-relaxed text-soft">{company.vision}</p>
          </Reveal>

          <Reveal delay={0.1}>
            <h3 className="mt-16 text-sm tracking-widest text-gold">FOCUS AREAS</h3>
            <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {company.focusAreas.map((area) => (
                <li key={area} className="glass-panel rounded-xl px-5 py-4 text-sm text-muted">
                  {area}
                </li>
              ))}
            </ul>
          </Reveal>

          <div className="mt-16 flex flex-wrap gap-4">
            {company.externalUrl ? (
              <a
                href={company.externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full bg-gold px-7 py-3 text-sm font-medium text-rich-black hover:bg-[#e8c75a] transition-colors"
              >
                Visit {company.name}
              </a>
            ) : (
              <span className="rounded-full border border-white/15 px-7 py-3 text-sm text-muted">
                Full site coming soon
              </span>
            )}
            <a
              href="mailto:support@goldspireventures.com"
              className="rounded-full border border-gold/30 px-7 py-3 text-sm text-gold hover:bg-gold/10 transition-colors"
            >
              Partner on this venture
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
