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
    staleTime: 60_000,
  });

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Spinner className="h-8 w-8 text-primary" />
      </div>
    );
  }

  if (isError || !data?.platformLegalAccepted) {
    return <Redirect to="/legal-acceptance" />;
  }

  return <>{children}</>;
}
