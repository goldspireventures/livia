import type { PersonaKind } from "./persona";

const BUSINESS_KEY = "livia.currentBusinessId";
const VIEW_AS_KEY = "livia.viewingAsStaffId";

export type EnterExperienceInput = {
  businessId: string;
  route: string;
  persona?: PersonaKind | null;
  viewAsStaffId?: string | null;
};

export function persistExperienceContext(input: EnterExperienceInput): void {
  try {
    window.localStorage.setItem(BUSINESS_KEY, input.businessId);
    if (input.viewAsStaffId) {
      window.localStorage.setItem(VIEW_AS_KEY, input.viewAsStaffId);
    } else {
      window.localStorage.removeItem(VIEW_AS_KEY);
    }
  } catch {
    // ignore
  }
  void input.persona;
}

export function openPublicBooking(dashboardBase: string, slug: string): void {
  window.open(`${dashboardBase}/b/${slug}`, "_blank", "noopener,noreferrer");
}

export function openExternal(url: string): void {
  window.open(url, "_blank", "noopener,noreferrer");
}
