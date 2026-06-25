import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { INDUSTRIES } from "@/data/industries";

export function IndustriesSection() {
  const [activeId, setActiveId] = useState(INDUSTRIES[0]!.id);
  const active = INDUSTRIES.find((i) => i.id === activeId) ?? INDUSTRIES[0]!;

  return (
    <section className="section-pad bg-rich-black">
      <div className="mx-auto max-w-7xl">
        <div className="mt-12 flex flex-wrap gap-3">
          {INDUSTRIES.map((industry) => (
            <button
              key={industry.id}
              type="button"
              onClick={() => setActiveId(industry.id)}
              className={`rounded-full px-5 py-2.5 text-sm transition-all ${
                activeId === industry.id
                  ? "bg-gold text-rich-black"
                  : "border border-white/10 text-muted hover:border-gold/30 hover:text-white"
              }`}
            >
              {industry.name}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={active.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.35 }}
            className="mt-10 glass-panel glow-gold rounded-2xl p-8 sm:p-12"
          >
            <h3 className="text-2xl font-semibold sm:text-3xl">{active.headline}</h3>
            <p className="mt-4 max-w-3xl text-lg leading-relaxed text-muted">{active.detail}</p>
            <ul className="mt-8 flex flex-wrap gap-3">
              {active.examples.map((ex) => (
                <li
                  key={ex}
                  className="rounded-full border border-gold/20 bg-gold/5 px-4 py-2 text-sm text-soft"
                >
                  {ex}
                </li>
              ))}
            </ul>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
