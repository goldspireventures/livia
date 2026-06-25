import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Livia-owned auth shell — replaces Clerk prebuilt card chrome. */
export function GatewayAuthCard({
  children,
  className,
  testId,
}: {
  children: ReactNode;
  className?: string;
  testId?: string;
}) {
  return (
    <div
      data-testid={testId}
      className={cn(
        "rounded-xl border border-border bg-card/80 p-6 shadow-xl backdrop-blur-xl",
        className,
      )}
    >
      {children}
    </div>
  );
}
