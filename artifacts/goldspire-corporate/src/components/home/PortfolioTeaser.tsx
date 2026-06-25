import { Link } from "wouter";
import { Reveal } from "@/components/Reveal";
import { PORTFOLIO_COMPANIES } from "@/data/portfolio";
import { statusLabel } from "@/lib/motion";

const FEATURED_SLUGS = ["livia", "mulah", "simi"] as const;

export function PortfolioTeaser() {
  const featured = FEATURED_SLUGS.map((slug) => PORTFOLIO_COMPANIES.find((c) => c.slug === slug)!);

  return (
    <section className="section-pad !py-20 bg-rich-black border-t border-white/5">
      <div className="mx-auto max-w-7xl">
        <Reveal>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs tracking-[0.3em] text-gold">PORTFOLIO</p>
              <h2 className="mt-3 text-2xl font-semibold sm:text-3xl">Companies we&apos;re building</h2>
            </div>
            <Link href="/portfolio" className="text-sm font-medium text-gold hover:underline">
              View all companies →
            </Link>
          </div>
        </Reveal>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {featured.map((company, i) => (
            <Reveal key={company.slug} delay={i * 0.06}>
              <Link href={`/companies/${company.slug}`}>
                <article
                  className={`group h-full rounded-xl border border-white/8 bg-gradient-to-br ${company.gradient} p-6 transition-colors hover:border-gold/30`}
                >
                  <p className="text-xs uppercase tracking-widest text-gold/80">{company.industry}</p>
                  <h3 className="mt-2 text-xl font-semibold group-hover:text-gold transition-colors">
                    {company.name}
                  </h3>
                  <p className="mt-2 text-sm text-muted line-clamp-2">{company.tagline}</p>
                  <p className="mt-4 text-xs text-soft/60">
                    {company.region === "global" ? "UK, EU & Global" : "Africa"} · {statusLabel[company.status]}
                  </p>
                </article>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
