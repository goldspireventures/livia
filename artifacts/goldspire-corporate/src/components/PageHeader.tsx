import { Reveal } from "@/components/Reveal";

export function PageHeader({
  label,
  title,
  description,
}: {
  label: string;
  title: string;
  description?: string;
}) {
  return (
    <section className="border-b border-white/5 bg-rich-black pt-28 pb-16 sm:pt-32 sm:pb-20">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
        <Reveal>
          <p className="text-xs tracking-[0.3em] text-gold">{label}</p>
          <h1 className="heading-section mt-4 max-w-4xl">{title}</h1>
          {description ? (
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted">{description}</p>
          ) : null}
        </Reveal>
      </div>
    </section>
  );
}
