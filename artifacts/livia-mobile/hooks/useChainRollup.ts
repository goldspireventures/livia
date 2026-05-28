import { customFetch } from "@workspace/api-client-react";
import { useCallback, useEffect, useState } from "react";
import type { ChainRollup } from "@/lib/chain-rollup";

export function useChainRollup(enabled: boolean) {
  const [rollup, setRollup] = useState<ChainRollup | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const reload = useCallback(async () => {
    if (!enabled) {
      setRollup(null);
      return;
    }
    setLoading(true);
    setError(false);
    try {
      const data = await customFetch<ChainRollup>("/api/me/chain-rollup");
      setRollup(data);
    } catch {
      setRollup(null);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { rollup, loading, error, reload };
}
