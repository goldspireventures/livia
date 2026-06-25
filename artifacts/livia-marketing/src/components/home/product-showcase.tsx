import { useEffect, useRef } from "react";
import { editorialCopy, type MarketingLocale } from "@/lib/marketing-editorial-i18n";
import "@/styles/constellation-product-showcase.css";

const base = import.meta.env.BASE_URL.replace(/\/$/, "");

type ProductShowcaseProps = {
  locale: MarketingLocale;
};

export function ProductShowcase({ locale }: ProductShowcaseProps) {
  const t = editorialCopy(locale).productShowcase;
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let raf = 0;
    const onMove = (event: PointerEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const rect = stage.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - 0.5;
        const y = (event.clientY - rect.top) / rect.height - 0.5;
        stage.style.setProperty("--cst-glow-x", `${50 + x * 8}%`);
        stage.style.setProperty("--cst-glow-y", `${20 + y * 6}%`);
      });
    };

    stage.addEventListener("pointermove", onMove);
    return () => {
      cancelAnimationFrame(raf);
      stage.removeEventListener("pointermove", onMove);
    };
  }, []);

  return (
    <section className="cst-showcase" aria-labelledby="cst-showcase-title" data-testid="marketing-product-showcase">
      <div className="cst-showcase__ambient" aria-hidden>
        <div className="cst-showcase__mesh" />
        <div
          className="cst-showcase__beam"
          style={{
            left: "var(--cst-glow-x, 50%)",
            top: "var(--cst-glow-y, 10%)",
          }}
        />
      </div>

      <div className="cst-showcase__inner">
        <header className="cst-showcase__header">
          <p className="cst-fold__eyebrow">{t.eyebrow}</p>
          <h2 id="cst-showcase-title" className="cst-showcase__title">
            {t.title}{" "}
            <span className="cst-showcase__title-accent">{t.titleAccent}</span>
          </h2>
          <p className="cst-showcase__sub">{t.subtitle}</p>
        </header>

        <div className="cst-showcase__stage" ref={stageRef}>
          <figure className="cst-showcase__device cst-showcase__device--web">
            <figcaption className="cst-showcase__label">{t.webLabel}</figcaption>
            <div className="cst-showcase__frame">
              <img
                src={`${base}/showcase/inbox-web.png`}
                alt={t.webAlt}
                loading="lazy"
                decoding="async"
                width={1280}
                height={720}
              />
            </div>
          </figure>

          <div className="cst-showcase__phones">
            <figure className="cst-showcase__device cst-showcase__device--booking">
              <figcaption className="cst-showcase__label">{t.bookingLabel}</figcaption>
              <div className="cst-showcase__frame cst-showcase__frame--phone cst-showcase__frame--phone-scroll">
                <img
                  src={`${base}/showcase/booking-page.png`}
                  alt={t.bookingAlt}
                  loading="lazy"
                  decoding="async"
                  width={390}
                  height={1200}
                />
              </div>
            </figure>

            <figure className="cst-showcase__device cst-showcase__device--mobile">
              <figcaption className="cst-showcase__label">{t.mobileLabel}</figcaption>
              <div className="cst-showcase__frame cst-showcase__frame--phone">
                <img
                  src={`${base}/showcase/today-mobile.png`}
                  alt={t.mobileAlt}
                  loading="lazy"
                  decoding="async"
                  width={390}
                  height={844}
                />
              </div>
            </figure>
          </div>
        </div>
      </div>
    </section>
  );
}
