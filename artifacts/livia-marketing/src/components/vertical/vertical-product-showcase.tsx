import { resolveVerticalShowcase } from "@/lib/marketing-vertical-showcase";
import { ShowcaseTodayGreetingFix } from "@/components/showcase/showcase-today-greeting-fix";

const base = import.meta.env.BASE_URL.replace(/\/$/, "");

export function VerticalProductShowcase({ slug }: { slug: string }) {
  const entry = resolveVerticalShowcase(slug);
  if (!entry) return null;

  const folder = entry.assetSlug;

  return (
    <section className="mt-10" aria-labelledby={`vertical-showcase-${slug}`}>
      <p className="cst-section-label">The product</p>
      <h2 id={`vertical-showcase-${slug}`} className="text-lg font-medium mb-4">
        Livia for this trade
      </h2>
      <div className="cst-vertical-showcase">
        <figure className="cst-vertical-showcase__card">
          <p className="cst-showcase__label">{entry.web.label}</p>
          <div className="cst-vertical-showcase__frame cst-vertical-showcase__frame--web">
            <img
              src={`${base}/showcase/verticals/${folder}/web.png`}
              alt={entry.web.caption}
              loading="lazy"
              decoding="async"
              width={1280}
              height={720}
            />
          </div>
          <figcaption className="cst-vertical-showcase__caption">{entry.web.caption}</figcaption>
        </figure>

        <figure className="cst-vertical-showcase__card">
          <p className="cst-showcase__label">{entry.mobile.label}</p>
          <div className="cst-vertical-showcase__frame cst-vertical-showcase__frame--phone">
            <div className="cst-vertical-showcase__phone-screen">
              <img
                src={`${base}/showcase/verticals/${folder}/mobile.png`}
                alt={entry.mobile.caption}
                loading="lazy"
                decoding="async"
                width={390}
                height={844}
              />
              {entry.mobile.greeting && !entry.mobile.fullPage ? (
                <ShowcaseTodayGreetingFix greeting={entry.mobile.greeting} />
              ) : null}
            </div>
          </div>
          <figcaption className="cst-vertical-showcase__caption">{entry.mobile.caption}</figcaption>
        </figure>
      </div>
    </section>
  );
}
