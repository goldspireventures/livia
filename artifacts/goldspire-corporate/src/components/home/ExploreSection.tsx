import { Link } from "wouter";
import { Reveal } from "@/components/Reveal";

const EXPLORE = [
  {
    href: "/philosophy",
    title: "Philosophy",
    desc: "How we think about building ecosystems, not just products.",
  },
  {
    href: "/industries",
    title: "Industries",
    desc: "Fintech, AI, commerce, mobility, identity, infrastructure and SaaS.",
  },
  {
    href: "/vision",
    title: "Vision 2035",
    desc: "Our long-range roadmap across Africa and global markets.",
  },
  {
    href: "/partner",
    title: "Partner",
    desc: "Investors, enterprises, governments and strategic alliances.",
  },
] as const;

export function ExploreSection() {
  return (
    <section className="section-pad !py-20 bg-navy">
      <div className="mx-auto max-w-7xl">
        <Reveal>
          <p className="text-xs tracking-[0.3em] text-gold">EXPLORE</p>
          <h2 className="mt-3 text-2xl font-semibold sm:text-3xl">Go deeper</h2>
        </Reveal>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {EXPLORE.map((item, i) => (
            <Reveal key={item.href} delay={i * 0.05}>
              <Link href={item.href}>
                <article className="group glass-panel rounded-xl p-6 transition-colors hover:border-gold/30">
                  <h3 className="text-lg font-semibold group-hover:text-gold transition-colors">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{item.desc}</p>
                  <span className="mt-4 inline-block text-sm text-gold">Learn more →</span>
                </article>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
