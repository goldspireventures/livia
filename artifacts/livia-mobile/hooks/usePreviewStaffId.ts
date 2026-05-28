import { useListStaff } from "@workspace/api-client-react";
import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useBusiness } from "@/contexts/BusinessContext";
import { useMembership } from "@/hooks/useMembership";
import { usePersona } from "@/hooks/usePersona";

const VIEW_AS_KEY = "livia.viewingAsStaffId";

/** When an owner previews the staff tab, pick a staff row for /my-day API calls. */
export function usePreviewStaffId(): {
  staffId: string | null;
  staffName: string | null;
  isPreview: boolean;
  loading: boolean;
} {
  const { currentBusiness } = useBusiness();
  const { role, staffId: membershipStaffId } = useMembership();
  const { kind, override } = usePersona();
  const bid = currentBusiness?.id ?? "";
  const [storedId, setStoredId] = useState<string | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(VIEW_AS_KEY).then(setStoredId);
  }, []);

  const isPreview =
    !!override && kind === "staff" && (role === "OWNER" || role === "ADMIN");

  const { data: staffList, isLoading } = useListStaff(
    bid,
    { isActive: true },
    { query: { enabled: !!bid && isPreview } as never },
  );

  if (!isPreview) {
    return {
      staffId: membershipStaffId,
      staffName: null,
      isPreview: false,
      loading: false,
    };
  }

  const pick =
    storedId && staffList?.some((s) => s.id === storedId)
      ? storedId
      : staffList?.[0]?.id ?? null;
  const name =
    staffList?.find((s) => s.id === pick)?.displayName ?? staffList?.[0]?.displayName ?? null;

  return { staffId: pick, staffName: name, isPreview: true, loading: isLoading };
}
