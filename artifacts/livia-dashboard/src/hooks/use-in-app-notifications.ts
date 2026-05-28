import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-fetch";
import { useBusiness } from "@/lib/business-context";

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
  const { business } = useBusiness();
  const bid = business?.id ?? "";
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["in-app-notifications", bid],
    queryFn: () => {
      const qs = bid ? `?businessId=${encodeURIComponent(bid)}&limit=50` : "?limit=50";
      return apiFetch<ListResponse>(`/me/notifications${qs}`);
    },
    refetchInterval: 45_000,
    staleTime: 20_000,
  });

  const markRead = useMutation({
    mutationFn: (id: string) =>
      apiFetch<{ ok: boolean }>(`/me/notifications/${id}/read`, { method: "PATCH" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["in-app-notifications"] }),
  });

  const markAllRead = useMutation({
    mutationFn: () =>
      apiFetch<{ updated: number }>(`/me/notifications/read-all`, {
        method: "POST",
        body: JSON.stringify(bid ? { businessId: bid } : {}),
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
