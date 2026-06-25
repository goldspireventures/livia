import { motion } from "framer-motion";
import { Reveal } from "@/components/Reveal";

const TIMELINE = [
  { year: "Identify", text: "Large-scale market inefficiencies others overlook." },
  { year: "Validate", text: "Rapid experimentation. Real users. Honest signals." },
  { year: "Scale", text: "Enduring businesses with global ambition." },
] as const;

export function PhilosophySection() {
  return (
    <section className="section-pad bg-rich-black">
      <div className="mx-auto max-w-7xl">
        <Reveal>
          <p className="max-w-3xl text-lg leading-relaxed text-muted">
            Goldspire Ventures exists to identify large-scale problems and create companies capable of
            solving them. Our focus spans financial technology, digital trust, mobility, artificial
            intelligence, commerce and emerging infrastructure.
          </p>
        </Reveal>

        <div className="relative mt-20">
          <div className="absolute left-4 top-0 bottom-0 w-px bg-gradient-to-b from-gold/60 via-gold/20 to-transparent sm:left-1/2 sm:-translate-x-px" />
          <div className="space-y-16">
            {TIMELINE.map((item, i) => (
              <Reveal key={item.year} delay={i * 0.08}>
                <motion.div
                  className={`relative flex flex-col gap-4 sm:w-1/2 ${
                    i % 2 === 0 ? "sm:mr-auto sm:pr-12 sm:text-right" : "sm:ml-auto sm:pl-12"
                  }`}
                  whileInView={{ opacity: 1, x: 0 }}
                  initial={{ opacity: 0, x: i % 2 === 0 ? -24 : 24 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6 }}
                >
                  <span className="absolute left-4 top-1 h-2 w-2 -translate-x-1/2 rounded-full bg-gold sm:left-1/2" />
                  <p className="pl-10 text-sm font-medium tracking-widest text-gold sm:pl-0">{item.year}</p>
                  <p className="pl-10 text-lg text-soft sm:pl-0">{item.text}</p>
                </motion.div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
