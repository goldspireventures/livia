import {
  filterSessionBusinesses,
  resolveStaffInviteLandingFromSession,
  type StaffInviteSurface,
} from "@workspace/policy";
import { apiFetch } from "@/lib/api-fetch";

type BusinessRow = {
  id: string;
  slug: string;
  vertical?: string | null;
};

type MembershipRow = {
  role: "OWNER" | "ADMIN" | "STAFF";
  isReception?: boolean;
};

/** Persona-aware landing after staff invite + legal — reads live membership. */
export async function resolveStaffInviteLandingForUser(args: {
  surface: StaffInviteSurface;
  clerkEmail?: string | null;
}): Promise<string> {
  const businesses = (await apiFetch<BusinessRow[]>("/me/businesses")) ?? [];
  const allowed = filterSessionBusinesses(businesses, args.clerkEmail ?? null);
  const biz = allowed[0];
  if (!biz?.id) {
    return args.surface === "mobile" ? "/(tabs)" : "/dashboard";
  }

  const membership = await apiFetch<MembershipRow>(`/me/businesses/${biz.id}/membership`).catch(
    () => null,
  );
  if (!membership?.role) {
    return args.surface === "mobile" ? "/(tabs)" : "/dashboard";
  }

  return resolveStaffInviteLandingFromSession({
    surface: args.surface,
    role: membership.role,
    isReception: membership.isReception,
    vertical: biz.vertical ?? null,
  });
}
