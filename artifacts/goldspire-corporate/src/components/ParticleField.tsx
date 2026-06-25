import { useEffect, useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

export function ParticleField() {
  const ref = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 40, damping: 20 });
  const sy = useSpring(my, { stiffness: 40, damping: 20 });
  const x1 = useTransform(sx, (v) => v * 0.02);
  const y1 = useTransform(sy, (v) => v * 0.02);
  const x2 = useTransform(sx, (v) => v * -0.015);
  const y2 = useTransform(sy, (v) => v * -0.015);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      mx.set(e.clientX - rect.left - rect.width / 2);
      my.set(e.clientY - rect.top - rect.height / 2);
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, [mx, my]);

  return (
    <div ref={ref} className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(212,175,55,0.12),transparent_55%)]" />
      <motion.div
        style={{ x: x1, y: y1 }}
        className="absolute -top-24 left-1/4 h-72 w-72 rounded-full bg-gold/10 blur-[100px]"
      />
      <motion.div
        style={{ x: x2, y: y2 }}
        className="absolute top-1/3 right-0 h-96 w-96 rounded-full bg-amber-600/10 blur-[120px]"
      />
      <div className="absolute inset-0 opacity-30 [background-image:radial-gradient(rgba(212,175,55,0.35)_1px,transparent_1px)] [background-size:28px_28px]" />
    </div>
  );
}
