import { useEffect, useState } from "react";
import { getOpsOperator, getWorkforceAccessSelf, type InternalOpsRole } from "../lib/api";
import { workforceOnboardingBundle, workforceTierLabel } from "../lib/workforce-onboarding";
import { buttonStyle, cardStyle } from "../styles/ops-ui";
import { INTERNAL_PAGES } from "../lib/internal-page-meta";
import { InternalPage } from "../components/InternalPage";

export function WorkforceJoinView({ role }: { role: InternalOpsRole }) {
  const [tierState, setTierState] = useState<Awaited<ReturnType<typeof getWorkforceAccessSelf>> | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const operator = getOpsOperator();

  useEffect(() => {
    void getWorkforceAccessSelf()
      .then(setTierState)
      .catch((e) => setErr(e instanceof Error ? e.message : "Could not load access tier"));
  }, [operator]);

  const tier = tierState?.tier ?? "none";
  const bundle = workforceOnboardingBundle(role, tier);

  return (
    <InternalPage
      title={INTERNAL_PAGES.workforce.title}
      subtitle={INTERNAL_PAGES.workforce.purpose}
    >
      <p style={{ color: "#94a3b8", lineHeight: 1.55, margin: 0, fontSize: 13 }}>
        Operator: <code>{operator || "(set at sign-in)"}</code>
      </p>

      {err ? <p style={{ color: "#f87171", fontSize: 13 }}>{err}</p> : null}

      {tierState?.goldspireRequiresCockpitGrant ? (
        <div
          role="alert"
          style={{
            marginBottom: 16,
            padding: "12px 14px",
            borderRadius: 10,
            border: "1px solid #f59e0b55",
            background: "#78350f44",
            fontSize: 13,
            lineHeight: 1.5,
          }}
        >
          <strong style={{ color: "#fbbf24" }}>@goldspireventures.com requires cockpit access.</strong>
          <p style={{ margin: "8px 0 0", color: "#fde68a" }}>
            Ask an exec to grant your inbox in the founder cockpit — domain alone does not unlock staging or beta.
          </p>
        </div>
      ) : null}

      <div
        style={{
          marginBottom: 20,
          padding: "12px 14px",
          borderRadius: 10,
          border: "1px solid #334155",
          background: "#1e293b",
          fontSize: 13,
          lineHeight: 1.5,
        }}
      >
        <strong style={{ color: "#fbbf24" }}>{workforceTierLabel(tier)}</strong>
        <p style={{ margin: "8px 0 0", color: "#cbd5e1" }}>{bundle.summary}</p>
      </div>

      <h3 style={{ fontSize: 15, margin: "0 0 10px" }}>{bundle.title}</h3>
      <ol style={{ margin: 0, paddingLeft: 20, display: "flex", flexDirection: "column", gap: 14 }}>
        {bundle.items.map((item) => (
          <li key={item.id} style={{ lineHeight: 1.5 }}>
            <strong>{item.label}</strong>
            <p style={{ margin: "4px 0 0", color: "#94a3b8", fontSize: 13 }}>{item.detail}</p>
            {item.doneHint ? (
              <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: 12 }}>{item.doneHint}</p>
            ) : null}
            {item.href ? (
              <a
                href={item.href}
                target="_blank"
                rel="noreferrer"
                style={{ ...buttonStyle, display: "inline-block", marginTop: 8, fontSize: 12, textDecoration: "none" }}
              >
                Open
              </a>
            ) : null}
          </li>
        ))}
      </ol>

      <p style={{ marginTop: 24, fontSize: 12, color: "#64748b", lineHeight: 1.5 }}>
        Canonical runbook: <code>docs/operations/WORKFORCE-ONBOARDING.md</code>. Goldspire grants are exec-cockpit only.
      </p>
    </InternalPage>
  );
}
