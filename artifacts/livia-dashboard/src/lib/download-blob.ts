import { getAuthTokenGetter } from "@workspace/api-client-react";

/** Authenticated file download (CSV, etc.) — avoids 304/JSON parse issues on export routes. */
export async function downloadAuthenticatedBlob(
  path: string,
  filename: string,
): Promise<void> {
  const getter = getAuthTokenGetter();
  const token = getter ? await getter() : null;
  const url = path.startsWith("http") ? path : `/api${path.startsWith("/") ? path : `/${path}`}`;
  const res = await fetch(url, {
    method: "GET",
    cache: "no-store",
    headers: {
      Accept: "text/csv, application/octet-stream",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text.slice(0, 200) || `Download failed (${res.status})`);
  }
  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = objectUrl;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(objectUrl);
}
