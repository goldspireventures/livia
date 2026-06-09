import { useCallback, useEffect, useState } from "react";
import { fetchDemoStatus, type DemoBusinessTenant } from "@/lib/demo-portal";

const CACHE_KEY = "livia.demoWorldStatus.v1";
const CACHE_TTL_MS = 5 * 60_000;

type DemoWorldStatusCache = {
  at: number;
  provisioned: boolean;
  businesses: DemoBusinessTenant[];
};

export function readDemoWorldStatusCache(): Omit<DemoWorldStatusCache, "at"> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DemoWorldStatusCache;
    if (Date.now() - parsed.at > CACHE_TTL_MS) return null;
    return { provisioned: parsed.provisioned, businesses: parsed.businesses };
  } catch {
    return null;
  }
}

export function writeDemoWorldStatusCache(provisioned: boolean, businesses: DemoBusinessTenant[]) {
  if (typeof window === "undefined") return;
  try {
    const payload: DemoWorldStatusCache = {
      at: Date.now(),
      provisioned,
      businesses,
    };
    window.sessionStorage.setItem(CACHE_KEY, JSON.stringify(payload));
  } catch {
    // sessionStorage may be unavailable
  }
}

export function clearDemoWorldStatusCache() {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(CACHE_KEY);
  } catch {
    // ignore
  }
}

export function useDemoWorldStatus() {
  const cached = readDemoWorldStatusCache();
  const [provisioned, setProvisioned] = useState(cached?.provisioned ?? false);
  const [tenants, setTenants] = useState<DemoBusinessTenant[]>(cached?.businesses ?? []);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const st = await fetchDemoStatus();
      const businesses = st.businesses ?? [];
      setProvisioned(st.provisioned);
      setTenants(businesses);
      writeDemoWorldStatusCache(st.provisioned, businesses);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Demo status unreachable";
      setError(msg);
      const fallback = readDemoWorldStatusCache();
      if (fallback) {
        setProvisioned(fallback.provisioned);
        setTenants(fallback.businesses);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { provisioned, tenants, loading, error, refresh };
}
