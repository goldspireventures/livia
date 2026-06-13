import React, { useEffect, useState } from "react";
import { buttonStyle, cardStyle } from "../styles/ops-ui";
import { Link } from "react-router-dom";
import { INTERNAL_PAGES } from "../lib/internal-page-meta";
import { InternalPage } from "../components/InternalPage";

export function WeeklyReportView() {
  const [markdown, setMarkdown] = useState<string | null>(null);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);

  const load = async () => {
    const secret = window.sessionStorage.getItem("livia.internal.opsSecret") ?? "";
    const res = await fetch("/api/internal/ops/reports/weekly-platform", {
      headers: { "X-Internal-Ops-Secret": secret },
    });
    const data = await res.json();
    setMarkdown(data.markdown ?? "");
    setGeneratedAt(data.generatedAt ?? null);
  };

  useEffect(() => {
    void load();
  }, []);

  return (
    <InternalPage
      title={INTERNAL_PAGES.reports.title}
      subtitle={INTERNAL_PAGES.reports.purpose}
      actions={
        <>
          <Link to="/platform" style={{ fontSize: 13, color: "#94a3b8", textDecoration: "none" }}>
            ← Platform
          </Link>
          <button type="button" style={buttonStyle} onClick={() => void load()}>
            Refresh
          </button>
        </>
      }
    >
      {generatedAt ? (
        <p style={{ color: "#94a3b8", fontSize: 12, margin: 0 }}>Generated {generatedAt}</p>
      ) : null}
      <pre
        style={{
          ...cardStyle,
          whiteSpace: "pre-wrap",
          fontSize: 13,
          lineHeight: 1.55,
          maxHeight: "calc(100vh - 220px)",
          overflow: "auto",
        }}
      >
        {markdown ?? "Loading…"}
      </pre>
    </InternalPage>
  );
}
