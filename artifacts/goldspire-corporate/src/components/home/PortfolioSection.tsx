import { useState } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Reveal } from "@/components/Reveal";
import { PORTFOLIO_REGIONS, getCompaniesByRegion } from "@/data/portfolio";
import type { PortfolioCompany } from "@/data/portfolio";
import { statusLabel } from "@/lib/motion";

function CompanyCard({
  company,
  active,
  onHover,
}: {
  company: PortfolioCompany;
  active: string | null;
  onHover: (slug: string | null) => void;
}) {
  return (
    <motion.article
      layout
      onHoverStart={() => onHover(company.slug)}
      onHoverEnd={() => onHover(null)}
      className={`group relative overflow-hidden rounded-2xl border border-white/8 bg-gradient-to-br ${company.gradient} p-8 sm:p-10 glow-gold transition-colors hover:border-gold/30`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-gold/80">{company.industry}</p>
          <h3 className="mt-2 text-2xl font-semibold sm:text-3xl">{company.name}</h3>
          <p className="mt-2 text-soft">{company.tagline}</p>
        </div>
        <span className="shrink-0 rounded-full border border-white/10 px-3 py-1 text-xs text-muted">
          {statusLabel[company.status]}
        </span>
      </div>

      <p className="mt-6 text-sm leading-relaxed text-muted">{company.description}</p>

      <AnimatePresence>
        {active === company.slug ? (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <p className="mt-4 text-sm italic text-soft/80">{company.vision}</p>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link href={`/companies/${company.slug}`} className="text-sm font-medium text-gold hover:underline">
          View company →
        </Link>
        {company.externalUrl ? (
          <a
            href={company.externalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-muted hover:text-white"
          >
            Visit site
          </a>
        ) : null}
      </div>
    </motion.article>
  );
}

export function PortfolioSection() {
  const [active, setActive] = useState<string | null>(null);
  let cardIndex = 0;

  return (
    <section className="section-pad !pt-12 bg-navy">
      <div className="mx-auto max-w-7xl space-y-20">
        {PORTFOLIO_REGIONS.map((region) => {
          const companies = getCompaniesByRegion(region.id);
          return (
            <div key={region.id}>
              <Reveal>
                <p className="text-xs tracking-[0.3em] text-gold">{region.label}</p>
                <p className="mt-2 max-w-2xl text-sm text-muted">{region.description}</p>
              </Reveal>
              <div className="mt-10 grid gap-6 lg:grid-cols-2">
                {companies.map((company) => {
                  const delay = cardIndex++ * 0.05;
                  return (
                    <Reveal key={company.slug} delay={delay}>
                      <CompanyCard company={company} active={active} onHover={setActive} />
                    </Reveal>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
