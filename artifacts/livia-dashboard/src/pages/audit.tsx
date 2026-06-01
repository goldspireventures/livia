import { useEffect } from "react";
import { useLocation } from "wouter";

/** Legacy route — activity log lives under Settings → Activity log. */
export default function AuditPage() {
  const [, setLocation] = useLocation();
  useEffect(() => {
    setLocation("/settings?tab=legal", { replace: true });
  }, [setLocation]);
  return null;
}
