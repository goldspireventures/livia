import { motion } from "framer-motion";
import { Reveal } from "@/components/Reveal";
import { VISION_2035_AREAS } from "@/data/industries";

export function Vision2035Section() {
  return (
    <section className="section-pad relative overflow-hidden bg-navy">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(212,175,55,0.08),transparent_45%)]" />
      <div className="relative mx-auto max-w-7xl">
        <div className="relative mt-4">
          <div className="absolute left-0 right-0 top-1/2 hidden h-px -translate-y-1/2 bg-gradient-to-r from-transparent via-gold/40 to-transparent lg:block" />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {VISION_2035_AREAS.map((area, i) => (
              <Reveal key={area.title} delay={i * 0.06}>
                <motion.div
                  whileHover={{ y: -4 }}
                  className="glass-panel relative rounded-xl p-6"
                >
                  <span className="text-xs font-mono text-gold/70">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className="mt-3 text-lg font-semibold">{area.title}</h3>
                  <p className="mt-2 text-sm text-muted">{area.desc}</p>
                  <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-white/5">
                    <motion.div
                      className="h-full bg-gradient-to-r from-gold/40 to-gold"
                      initial={{ width: 0 }}
                      whileInView={{ width: `${55 + i * 7}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 1.2, delay: i * 0.1 }}
                    />
                  </div>
                </motion.div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
