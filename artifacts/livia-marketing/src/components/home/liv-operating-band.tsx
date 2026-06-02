import { editorialCopy, type MarketingLocale } from "@/lib/marketing-editorial-i18n";
import "@/styles/constellation-home.css";

type LivOperatingBandProps = {
  locale: MarketingLocale;
};

export function LivOperatingBand({ locale }: LivOperatingBandProps) {
  const t = editorialCopy(locale).homeOs.livBand;

  return (
    <section className="os-liv-band" aria-labelledby="os-liv-title">
      <div className="os-liv-band__inner">
        <div>
          <h2 id="os-liv-title" className="os-liv-band__title">
            {t.title}
          </h2>
          <p className="os-liv-band__body">{t.body}</p>
          <ul className="os-liv-band__list">
            {t.bullets.map((bullet) => (
              <li key={bullet}>{bullet}</li>
            ))}
          </ul>
        </div>
        <aside className="os-liv-band__panel" aria-label={t.panelLabel}>
          <p className="os-liv-band__panel-label">{t.panelLabel}</p>
          {t.panelLines.map((line) => (
            <p
              key={line.text}
              className={`os-liv-band__panel-line ${line.muted ? "os-liv-band__panel-line--muted" : ""}`}
            >
              {line.text}
            </p>
          ))}
        </aside>
      </div>
    </section>
  );
}
