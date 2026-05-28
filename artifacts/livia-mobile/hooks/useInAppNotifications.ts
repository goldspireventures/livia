import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { customFetch } from "@workspace/api-client-react";
import { useBusiness } from "@/contexts/BusinessContext";

export type InAppNotification = {
  id: string;
  businessId: string | null;
  kind: string;
  priority: "info" | "watch" | "act";
  personaHint: string | null;
  title: string;
  body: string;
  href: string | null;
  mobileHref: string | null;
  resourceKind: string | null;
  resourceId: string | null;
  readAt: string | null;
  createdAt: string;
};

type ListResponse = {
  data: InAppNotification[];
  unreadCount: number;
};

export function useInAppNotifications() {
  const { currentBusiness } = useBusiness();
  const bid = currentBusiness?.id ?? "";
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["in-app-notifications", bid],
    queryFn: () => {
      const qs = bid ? `?businessId=${encodeURIComponent(bid)}&limit=50` : "?limit=50";
      return customFetch<ListResponse>(`/api/me/notifications${qs}`);
    },
    enabled: !!bid,
    refetchInterval: 45_000,
    staleTime: 20_000,
  });

  const markRead = useMutation({
    mutationFn: (id: string) =>
      customFetch<{ ok: boolean }>(`/api/me/notifications/${id}/read`, { method: "PATCH" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["in-app-notifications"] }),
  });

  const markAllRead = useMutation({
    mutationFn: () =>
      customFetch<{ updated: number }>(`/api/me/notifications/read-all`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId: bid }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["in-app-notifications"] }),
  });

  return {
    notifications: query.data?.data ?? [],
    unreadCount: query.data?.unreadCount ?? 0,
    isLoading: query.isLoading,
    markRead: markRead.mutateAsync,
    markAllRead: markAllRead.mutateAsync,
    refetch: query.refetch,
  };
}
