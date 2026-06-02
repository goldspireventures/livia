import { editorialCopy, type MarketingLocale } from "@/lib/marketing-editorial-i18n";
import "@/styles/constellation-home.css";

type OperatingPhysicsProps = {
  locale: MarketingLocale;
};

export function OperatingPhysics({ locale }: OperatingPhysicsProps) {
  const t = editorialCopy(locale).homeOs;

  return (
    <section className="os-physics" aria-labelledby="os-physics-title">
      <div className="os-physics__inner">
        <header className="os-physics__header">
          <h2 id="os-physics-title" className="os-physics__title">
            {t.physicsTitle}
          </h2>
          <p className="os-physics__subtitle">{t.physicsSubtitle}</p>
        </header>
        <div className="os-physics__grid">
          {t.physics.map((item, i) => (
            <article key={item.title} className="os-physics__card">
              <p className="os-physics__card-index">{String(i + 1).padStart(2, "0")}</p>
              <h3 className="os-physics__card-title">{item.title}</h3>
              <p className="os-physics__card-body">{item.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
