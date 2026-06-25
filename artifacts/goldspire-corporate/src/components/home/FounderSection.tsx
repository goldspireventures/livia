import { Reveal } from "@/components/Reveal";

export function FounderSection() {
  return (
    <section className="section-pad bg-rich-black">
      <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[280px_1fr] lg:items-start">
        <Reveal>
          <div className="relative mx-auto aspect-[4/5] w-full max-w-[280px] overflow-hidden rounded-2xl border border-gold/20 bg-gradient-to-br from-gold/10 via-navy to-rich-black">
            <div className="absolute inset-0 flex items-end p-6">
              <p className="text-xs tracking-widest text-gold/80">FOUNDER & CEO</p>
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-6xl font-light text-gold/20">G</span>
            </div>
          </div>
        </Reveal>

        <div>
          <Reveal>
            <p className="text-xs tracking-[0.3em] text-gold">LEADERSHIP</p>
            <h2 className="heading-section mt-4">Building for the long arc</h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mt-6 text-lg leading-relaxed text-muted">
              Goldspire was founded on a simple conviction: the most valuable companies are built at the
              intersection of large unsolved problems and exceptional execution. We are not a single-product
              startup — we are a venture studio designed to originate, validate, and scale multiple
              category-defining businesses.
            </p>
          </Reveal>
          <Reveal delay={0.15}>
            <p className="mt-4 text-lg leading-relaxed text-muted">
              From digital trust and financial infrastructure to intelligent platforms and mobility systems,
              our mission is to create enduring companies that serve millions — across Africa, Europe, and
              global markets — with precision, ambition, and integrity.
            </p>
          </Reveal>
          <Reveal delay={0.2}>
            <blockquote className="mt-8 border-l-2 border-gold/50 pl-6 text-soft italic">
              &ldquo;We do not chase trends. We build what the world will need before it knows to ask.&rdquo;
            </blockquote>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
