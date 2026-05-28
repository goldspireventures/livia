import type { ReactNode } from "react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

type Props = {
  isLoading: boolean;
  isError: boolean;
  hasData: boolean;
  backHref: string;
  entityLabel: string;
  businessName?: string;
  onRetry?: () => void;
  children: ReactNode;
};

/** Shared loading / not-found / error shell for staff, customer, booking detail routes. */
export function EntityDetailStates({
  isLoading,
  isError,
  hasData,
  backHref,
  entityLabel,
  businessName,
  onRetry,
  children,
}: Props) {
  if (isLoading) {
    return (
      <div className="space-y-4 max-w-2xl">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!hasData) {
    return (
      <div className="space-y-4 max-w-2xl">
        <Card>
          <CardContent className="py-16 text-center space-y-3">
            <p className="text-muted-foreground">
              {isError
                ? `Could not load this ${entityLabel}.`
                : `${entityLabel.charAt(0).toUpperCase()}${entityLabel.slice(1)} not found`}
            </p>
            {businessName ? (
              <p className="text-xs text-muted-foreground">
                Active location: <span className="font-medium text-foreground">{businessName}</span>.
                Open this link from that business&apos;s list, or switch location in the sidebar.
              </p>
            ) : null}
            <div className="flex flex-wrap justify-center gap-2 pt-2">
              {onRetry ? (
                <Button type="button" variant="outline" size="sm" onClick={onRetry}>
                  Retry
                </Button>
              ) : null}
              <Link href={backHref}>
                <Button type="button" variant="default" size="sm">
                  Back to list
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
