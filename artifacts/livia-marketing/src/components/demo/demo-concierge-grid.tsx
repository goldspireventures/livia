import { Link } from "wouter";
import { ArrowRight, Lock } from "lucide-react";
import { listMarketingDemoConciergeEntries, resolveMarketingConciergeThumbUrl } from "@workspace/policy";
import { dashboardWedgeUrl } from "@/lib/marketing-links";
import { readDemoGateKeyFromLocation } from "@/lib/marketing-demo-gate-client";
import { cn } from "@/lib/utils";

const base = import.meta.env.BASE_URL.replace(/\/$/, "");

export function DemoConciergeGrid() {
  const entries = listMarketingDemoConciergeEntries();
  const gateKey = readDemoGateKeyFromLocation();

  return (
    <ul className="cst-demo-concierge__portals">
      {entries.map((entry) => {
        const thumbSrc = resolveMarketingConciergeThumbUrl(entry.vertical, base);
        const href = entry.unlocked ? dashboardWedgeUrl(entry.vertical, gateKey) : undefined;

        const inner = (
          <>
            {thumbSrc ? (
              <img
                src={thumbSrc}
                alt=""
                className="cst-demo-portal__thumb"
                width={280}
                height={168}
                loading="lazy"
                decoding="async"
              />
            ) : (
              <div className="cst-demo-portal__thumb cst-demo-portal__thumb--placeholder" aria-hidden>
                <span className="cst-demo-portal__thumb-label">{entry.label}</span>
              </div>
            )}
            <div className="cst-demo-portal__body">
              <p className="cst-demo-portal__title">{entry.title}</p>
              <p className="cst-demo-portal__desc">{entry.description}</p>
              {!entry.unlocked ? (
                <p className="cst-demo-portal__lock-note">Coming soon — request a demo for early access</p>
              ) : null}
            </div>
            <span className="cst-demo-portal__action" aria-hidden>
              {entry.unlocked ? (
                <ArrowRight strokeWidth={1.35} />
              ) : (
                <Lock strokeWidth={1.35} />
              )}
            </span>
          </>
        );

        return (
          <li key={entry.vertical}>
            {entry.unlocked && href ? (
              <a
                href={href}
                className={cn("cst-demo-portal group", "cst-demo-portal--unlocked")}
                data-testid="marketing-demo-link"
                data-vertical={entry.vertical}
              >
                {inner}
              </a>
            ) : (
              <div
                className={cn("cst-demo-portal", "cst-demo-portal--locked")}
                aria-disabled
                data-vertical={entry.vertical}
              >
                {inner}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
