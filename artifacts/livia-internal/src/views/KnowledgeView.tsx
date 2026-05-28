import React, { useCallback, useEffect, useState } from "react";
import {
  fetchCompanyDoc,
  fetchCompanyDocsIndex,
  type CompanyDocEntry,
} from "../lib/api";
import { buttonStyle, inputStyle } from "../styles/ops-ui";

export function KnowledgeView({ initialDocPath }: { initialDocPath?: string }) {
  const [canonical, setCanonical] = useState<CompanyDocEntry[]>([]);
  const [byCategory, setByCategory] = useState<Record<string, CompanyDocEntry[]>>({});
  const [filter, setFilter] = useState("");
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [content, setContent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadIndex = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const idx = await fetchCompanyDocsIndex();
      setCanonical(idx.canonical);
      setByCategory(idx.byCategory);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load docs");
    } finally {
      setLoading(false);
    }
  }, []);

  const openDoc = useCallback(async (path: string) => {
    setSelectedPath(path);
    setContent(null);
    setError(null);
    try {
      const doc = await fetchCompanyDoc(path);
      setContent(doc.content);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load document");
    }
  }, []);

  useEffect(() => {
    void loadIndex();
  }, [loadIndex]);

  useEffect(() => {
    if (initialDocPath) void openDoc(initialDocPath);
  }, [initialDocPath, openDoc]);

  useEffect(() => {
    const pending =
      typeof window !== "undefined" ? window.sessionStorage.getItem("livia.internal.docPath") : null;
    if (!pending) return;
    window.sessionStorage.removeItem("livia.internal.docPath");
    void openDoc(pending);
  }, [openDoc]);

  const q = filter.trim().toLowerCase();
  const flat = Object.entries(byCategory).flatMap(([cat, docs]) =>
    docs.map((d) => ({ ...d, category: cat })),
  );
  const filtered = q
    ? flat.filter(
        (d) =>
          d.path.toLowerCase().includes(q) ||
          d.title.toLowerCase().includes(q) ||
          d.category.toLowerCase().includes(q),
      )
    : flat;

  const sections: { cat: string; docs: CompanyDocEntry[] }[] = q
    ? [{ cat: "Results", docs: filtered }]
    : Object.entries(byCategory).map(([cat, docs]) => ({ cat, docs }));

  return (
    <div style={{ display: "grid", gridTemplateColumns: "minmax(240px, 320px) 1fr", gap: 20 }}>
      <aside>
        <h2 style={{ fontSize: 18, marginBottom: 8 }}>Knowledge hub</h2>
        <p style={{ color: "#94a3b8", fontSize: 13, lineHeight: 1.5, marginBottom: 12 }}>
          Business, engineering, and ops docs from the repo — read-only for Livia Inc support.
        </p>
        <input
          type="search"
          placeholder="Search docs…"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={{ ...inputStyle, width: "100%", marginBottom: 12 }}
        />
        {loading ? <p style={{ color: "#94a3b8" }}>Loading index…</p> : null}
        {error && !content ? (
          <p style={{ color: "#f87171" }}>{error}</p>
        ) : null}
        <section style={{ marginBottom: 16 }}>
          <h3 style={{ fontSize: 13, color: "#f59e0b", marginBottom: 6 }}>Start here</h3>
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {canonical.map((d) => (
              <li key={d.path} style={{ marginBottom: 4 }}>
                <button
                  type="button"
                  onClick={() => void openDoc(d.path)}
                  style={{
                    ...buttonStyle,
                    width: "100%",
                    textAlign: "left",
                    background: selectedPath === d.path ? "#334155" : "#1e293b",
                    fontSize: 12,
                  }}
                >
                  {d.title}
                </button>
              </li>
            ))}
          </ul>
        </section>
        <div style={{ maxHeight: "50vh", overflowY: "auto" }}>
          {sections.map(({ cat, docs }) => (
              <section key={cat} style={{ marginBottom: 12 }}>
                <h3 style={{ fontSize: 12, color: "#64748b", textTransform: "uppercase" }}>{cat}</h3>
                <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                  {docs.slice(0, q ? 40 : 12).map((d) => (
                    <li key={d.path} style={{ marginBottom: 2 }}>
                      <button
                        type="button"
                        onClick={() => void openDoc(d.path)}
                        style={{
                          ...buttonStyle,
                          width: "100%",
                          textAlign: "left",
                          background: selectedPath === d.path ? "#334155" : "transparent",
                          fontSize: 11,
                          padding: "4px 8px",
                        }}
                      >
                        {d.path}
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
        </div>
      </aside>
      <article
        style={{
          background: "#1e293b",
          borderRadius: 8,
          padding: 20,
          minHeight: 400,
          overflow: "auto",
        }}
      >
        {selectedPath ? (
          <header style={{ marginBottom: 16, borderBottom: "1px solid #334155", paddingBottom: 8 }}>
            <code style={{ fontSize: 12, color: "#94a3b8" }}>{selectedPath}</code>
          </header>
        ) : (
          <p style={{ color: "#94a3b8" }}>Select a document from the index.</p>
        )}
        {content ? (
          <pre
            style={{
              whiteSpace: "pre-wrap",
              fontFamily: "ui-monospace, monospace",
              fontSize: 13,
              lineHeight: 1.55,
              color: "#e2e8f0",
              margin: 0,
            }}
          >
            {content}
          </pre>
        ) : selectedPath && !error ? (
          <p style={{ color: "#94a3b8" }}>Loading…</p>
        ) : null}
      </article>
    </div>
  );
}
