import { useEffect, useRef, useState, type ReactNode } from "react";

type LazyMountProps = {
  children: ReactNode;
  /** Reserve space before mount to avoid layout jump */
  minHeight?: number;
  rootMargin?: string;
};

/** Mount children when near the viewport — keeps Today tab first paint lean. */
export function LazyMount({
  children,
  minHeight = 0,
  rootMargin = "240px 0px",
}: LazyMountProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || visible) return;

    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { rootMargin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [visible, rootMargin]);

  return (
    <div ref={ref} style={minHeight > 0 ? { minHeight } : undefined}>
      {visible ? children : null}
    </div>
  );
}
