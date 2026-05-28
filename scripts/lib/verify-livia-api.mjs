/**
 * Confirm :3000 is the Livia api-server (not another project's dev server).
 */
export async function verifyLiviaApi(baseUrl = "http://127.0.0.1:3000") {
  const url = `${baseUrl.replace(/\/$/, "")}/api/healthz`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    const text = (await res.text()).trim();
    if (text.startsWith("<") || text.startsWith("<!")) {
      return {
        ok: false,
        reason:
          "Port 3000 returned HTML — another app is bound there (not Livia api-server). Stop it and run pnpm dev:api.",
      };
    }
    if (!res.ok) {
      return { ok: false, reason: `GET /api/healthz → ${res.status}` };
    }
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      return { ok: false, reason: "GET /api/healthz did not return JSON" };
    }
    if (data?.status !== "ok") {
      return { ok: false, reason: "Unexpected /api/healthz payload (expected { status: \"ok\" })" };
    }
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      reason: e instanceof Error ? e.message : "API unreachable on :3000",
    };
  }
}
