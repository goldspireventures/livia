import { useEffect } from "react";
import { Spinner } from "@/components/ui/spinner";
import { prospectDemoEntryUrl } from "@/lib/demo-routes";

/** Full-page redirect to marketing book-demo or invited concierge. */
export function ProspectDemoRedirect() {
  useEffect(() => {
    window.location.replace(prospectDemoEntryUrl());
  }, []);

  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <Spinner className="h-8 w-8 text-primary" />
    </div>
  );
}
