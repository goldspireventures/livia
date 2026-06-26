import { useQuery } from "@tanstack/react-query";
import { Redirect } from "wouter";
import { ReactNode } from "react";
import { apiFetch } from "@/lib/api-fetch";
import { Spinner } from "@/components/ui/spinner";

type MeLegal = {
  platformLegalAccepted?: boolean;
};

export function PlatformLegalGate({ children }: { children: ReactNode }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["me-legal"],
    queryFn: () => apiFetch<MeLegal>("/me"),
    staleTime: 5 * 60_000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Spinner className="h-8 w-8 text-primary" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center gap-4 bg-background px-6 text-center">
        <p className="text-lg font-medium text-foreground">Could not verify your account</p>
        <p className="max-w-md text-sm text-muted-foreground">
          Your session is valid but we could not reach Livia. Check your connection and try again.
        </p>
        <button
          type="button"
          className="text-sm font-medium text-primary underline underline-offset-2"
          onClick={() => window.location.reload()}
        >
          Retry
        </button>
      </div>
    );
  }

  if (!data?.platformLegalAccepted) {
    return <Redirect to="/legal-acceptance" />;
  }

  return <>{children}</>;
}
