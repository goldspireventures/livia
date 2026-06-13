import { useEffect } from "react";
import { useLocation } from "wouter";
import { unifiedConsultInboxRoute } from "@workspace/policy";

/** Legacy /enquiries → unified /inbox (event-vendors consult-first). */
export default function EnquiriesLegacyRedirect() {
  const [, setLoc] = useLocation();

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const id = q.get("id");
    if (id) {
      q.set("lead", id);
      q.delete("id");
    }
    const suffix = q.toString() ? `?${q.toString()}` : "";
    setLoc(`${unifiedConsultInboxRoute()}${suffix}`);
  }, [setLoc]);

  return null;
}
