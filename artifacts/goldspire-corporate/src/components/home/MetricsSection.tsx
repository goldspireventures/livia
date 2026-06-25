import { Reveal } from "@/components/Reveal";
import { Counter } from "@/components/Counter";

const METRICS = [
  { label: "Companies Founded", value: 6 },
  { label: "Products Launched", value: 2 },
  { label: "Markets in Focus", value: 12, suffix: "+" },
  { label: "Users Impacted", value: 50, suffix: "K+" },
] as const;

export function MetricsSection() {
  return (
    <section className="section-pad bg-navy border-y border-white/5">
      <div className="mx-auto max-w-7xl">
        <div className="mt-4 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {METRICS.map((m, i) => (
            <Reveal key={m.label} delay={i * 0.08}>
              <div className="text-center">
                <p className="text-4xl font-semibold text-gold sm:text-5xl">
                  <Counter value={m.value} suffix={"suffix" in m ? m.suffix : ""} />
                </p>
                <p className="mt-3 text-sm text-muted">{m.label}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
