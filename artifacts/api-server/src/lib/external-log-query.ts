/**
 * Query external log backends for internal ops (Loki LogQL, OpenObserve SQL).
 * Push is handled by log-transport.ts; this module is read-only search.
 */
import { getGrafanaUrl, getLokiQueryBaseUrl } from "./env-config";

export type ExternalLogLine = {
  timestamp: string;
  line: string;
  labels?: Record<string, string>;
};

export type ExternalLogQueryResult = {
  backend: "loki" | "openobserve" | "none";
  configured: boolean;
  lines: ExternalLogLine[];
  error?: string;
  queryHint?: string;
};

export function getLokiQueryBase(): string | null {
  return getLokiQueryBaseUrl() ?? null;
}

/** Field contract for OpenObserve / Elasticsearch-style indexes (api-server JSON logs). */
export function getLogFieldContract(): {
  stream: string;
  recommendedIndexFields: string[];
  logqlExamples: string[];
  openObserveSqlExamples: string[];
} {
  const stream = process.env.OPENOBSERVE_STREAM?.trim() || "default";
  return {
    stream,
    recommendedIndexFields: [
      "request_id",
      "tenant_id",
      "user_id",
      "level",
      "method",
      "path",
      "status",
      "duration_ms",
      "msg",
      "service",
      "env",
    ],
    logqlExamples: [
      '{service="api-server"} | json | level="error"',
      '{service="api-server"} | json | request_id="<UUID>"',
      '{service="api-server"} | json | tenant_id="<BUSINESS_UUID>"',
      '{service="api-server"} | json | status >= 500',
    ],
    openObserveSqlExamples: [
      `SELECT * FROM ${stream} WHERE level = 'error' ORDER BY _timestamp DESC LIMIT 100`,
      `SELECT * FROM ${stream} WHERE request_id = '<UUID>' ORDER BY _timestamp DESC LIMIT 50`,
      `SELECT * FROM ${stream} WHERE tenant_id = '<BUSINESS_UUID>' AND level = 'error'`,
    ],
  };
}

export function getLogBackendStatus(): {
  lokiPush: boolean;
  lokiQuery: boolean;
  openObserve: boolean;
  grafanaLocalUrl: string | null;
} {
  return {
    lokiPush: Boolean(process.env.LOKI_PUSH_URL?.trim()),
    lokiQuery: Boolean(getLokiQueryBase()),
    openObserve: Boolean(process.env.OPENOBSERVE_URL?.trim()),
    grafanaLocalUrl: getGrafanaUrl() ?? (getLokiQueryBase() ? "http://127.0.0.1:3000" : null),
  };
}

function nsFromIso(iso: string): string {
  const ms = Date.parse(iso);
  if (Number.isNaN(ms)) return `${Date.now()}000000000`;
  return `${ms}000000`;
}

/** LogQL query_range against local or Grafana Cloud Loki. */
export async function queryLokiLogs(args: {
  query: string;
  start: string;
  end: string;
  limit?: number;
}): Promise<ExternalLogQueryResult> {
  const base = getLokiQueryBase();
  if (!base) {
    return {
      backend: "none",
      configured: false,
      lines: [],
      queryHint: '{service="api-server"} | json',
    };
  }

  const limit = Math.min(Math.max(args.limit ?? 100, 1), 500);
  const url = new URL(`${base}/loki/api/v1/query_range`);
  url.searchParams.set("query", args.query);
  url.searchParams.set("start", nsFromIso(args.start));
  url.searchParams.set("end", nsFromIso(args.end));
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("direction", "backward");

  try {
    const res = await fetch(url.toString(), {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(12_000),
    });
    const body = (await res.json()) as {
      status?: string;
      data?: {
        result?: Array<{
          stream?: Record<string, string>;
          values?: Array<[string, string]>;
        }>;
      };
    };

    if (!res.ok) {
      return {
        backend: "loki",
        configured: true,
        lines: [],
        error: `Loki ${res.status}`,
        queryHint: args.query,
      };
    }

    const lines: ExternalLogLine[] = [];
    for (const stream of body.data?.result ?? []) {
      for (const [ts, line] of stream.values ?? []) {
        const ms = Number.parseInt(ts.slice(0, 13), 10);
        lines.push({
          timestamp: Number.isFinite(ms) ? new Date(ms).toISOString() : new Date().toISOString(),
          line,
          labels: stream.stream,
        });
      }
    }
    lines.sort((a, b) => b.timestamp.localeCompare(a.timestamp));

    return {
      backend: "loki",
      configured: true,
      lines: lines.slice(0, limit),
      queryHint: args.query,
    };
  } catch (err) {
    return {
      backend: "loki",
      configured: true,
      lines: [],
      error: err instanceof Error ? err.message : String(err),
      queryHint: args.query,
    };
  }
}

/** OpenObserve SQL search (optional self-hosted / cloud). */
export async function queryOpenObserveLogs(args: {
  sql: string;
  limit?: number;
}): Promise<ExternalLogQueryResult> {
  const baseUrl = process.env.OPENOBSERVE_URL?.trim()?.replace(/\/+$/, "");
  if (!baseUrl) {
    return { backend: "none", configured: false, lines: [] };
  }

  const org = process.env.OPENOBSERVE_ORG?.trim() || "default";
  const user = process.env.OPENOBSERVE_USER?.trim();
  const password = process.env.OPENOBSERVE_PASSWORD?.trim();
  const limit = Math.min(Math.max(args.limit ?? 100, 1), 500);

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (user && password) {
    headers.Authorization = `Basic ${Buffer.from(`${user}:${password}`).toString("base64")}`;
  }

  try {
    const res = await fetch(`${baseUrl}/api/${org}/_search`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        query: { sql: args.sql },
        size: limit,
        from: 0,
      }),
      signal: AbortSignal.timeout(15_000),
    });

    const body = (await res.json()) as {
      hits?: Array<{ _timestamp?: number | string; [key: string]: unknown }>;
      error?: string;
    };

    if (!res.ok) {
      return {
        backend: "openobserve",
        configured: true,
        lines: [],
        error: body.error ?? `OpenObserve ${res.status}`,
      };
    }

    const lines: ExternalLogLine[] = (body.hits ?? []).map((hit) => {
      const ts =
        typeof hit._timestamp === "number"
          ? new Date(hit._timestamp / 1000).toISOString()
          : typeof hit._timestamp === "string"
            ? new Date(hit._timestamp).toISOString()
            : new Date().toISOString();
      const { _timestamp: _t, ...rest } = hit;
      return {
        timestamp: ts,
        line: JSON.stringify(rest),
      };
    });

    return { backend: "openobserve", configured: true, lines };
  } catch (err) {
    return {
      backend: "openobserve",
      configured: true,
      lines: [],
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
