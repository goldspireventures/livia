import { useQuery } from "@tanstack/react-query";
import { Redirect } from "wouter";
import { ReactNode } from "react";
import { ApiFetchError, apiFetch } from "@/lib/api-fetch";
import { Spinner } from "@/components/ui/spinner";

type MeLegal = {
  platformLegalAccepted?: boolean;
};

export function PlatformLegalGate({ children }: { children: ReactNode }) {
  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["me-legal"],
    queryFn: () => apiFetch<MeLegal>("/me"),
    staleTime: 5 * 60_000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    retry: (failureCount, err) => {
      if (err instanceof ApiFetchError && err.status === 401) return false;
      return failureCount < 2;
    },
  });

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Spinner className="h-8 w-8 text-primary" />
      </div>
    );
  }

  if (isError) {
    const apiErr = error instanceof ApiFetchError ? error : null;
    const unauthorized = apiErr?.status === 401;
    const serverError = apiErr != null && apiErr.status >= 500;
    const detail = unauthorized
      ? import.meta.env.DEV
        ? "Sign-in succeeded, but the server rejected your session. This usually means production Clerk keys on Railway (sk_live_) do not match the app (pk_live_ on Vercel)."
        : "Sign-in succeeded, but we could not verify your session with Livia's servers. Sign out, wait a moment, and try again. If it keeps happening, email support@goldspireventures.com."
      : serverError
        ? "Livia's servers returned an error while loading your account. Try again in a moment."
        : "Your session is valid but we could not reach Livia. Check your connection and try again.";
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center gap-4 bg-background px-6 text-center">
        <p className="text-lg font-medium text-foreground">Could not verify your account</p>
        <p className="max-w-md text-sm text-muted-foreground">{detail}</p>
        {apiErr?.requestId ? (
          <p className="text-xs text-muted-foreground">Reference: {apiErr.requestId}</p>
        ) : null}
        <button
          type="button"
          className="text-sm font-medium text-primary underline underline-offset-2 disabled:opacity-50"
          disabled={isFetching}
          onClick={() => void refetch()}
        >
          {isFetching ? "Retrying…" : "Retry"}
        </button>
      </div>
    );
  }

  if (!data?.platformLegalAccepted) {
    return <Redirect to="/legal-acceptance" />;
  }

  return <>{children}</>;
}
