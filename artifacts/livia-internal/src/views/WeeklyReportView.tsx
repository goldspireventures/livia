import React, { useEffect, useState } from "react";
import { buttonStyle } from "../styles/ops-ui";

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
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <h2 style={{ fontSize: 18, margin: 0 }}>Weekly platform report</h2>
        <button type="button" style={buttonStyle} onClick={() => void load()}>
          Refresh
        </button>
      </div>
      {generatedAt ? (
        <p style={{ color: "#94a3b8", fontSize: 12, marginBottom: 12 }}>Generated {generatedAt}</p>
      ) : null}
      <pre
        style={{
          whiteSpace: "pre-wrap",
          background: "#1e293b",
          padding: 16,
          borderRadius: 8,
          fontSize: 13,
          lineHeight: 1.55,
        }}
      >
        {markdown ?? "Loading…"}
      </pre>
    </div>
  );
}
