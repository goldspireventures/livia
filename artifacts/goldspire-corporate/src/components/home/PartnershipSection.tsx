import { Reveal } from "@/components/Reveal";

const PARTNER_TYPES = [
  "Investors",
  "Design Partners",
  "Enterprise Partners",
  "Governments",
  "Strategic Alliances",
] as const;

export function PartnershipSection() {
  return (
    <section className="section-pad bg-navy">
      <div className="mx-auto max-w-4xl text-center">
        <Reveal>
          <div className="flex flex-wrap justify-center gap-3">
            {PARTNER_TYPES.map((type) => (
              <span
                key={type}
                className="rounded-full border border-white/10 px-4 py-2 text-sm text-soft"
              >
                {type}
              </span>
            ))}
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <a
            href="mailto:support@goldspireventures.com?subject=Partnership%20inquiry"
            className="mt-10 inline-flex rounded-full bg-gold px-8 py-4 text-sm font-medium text-rich-black hover:bg-[#e8c75a] transition-colors"
          >
            Start a conversation
          </a>
        </Reveal>
      </div>
    </section>
  );
}
