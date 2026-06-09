import { cn } from "@/lib/utils";

/** Primary CTA on W4 operational pages (matches Today / bookings). */
export function beautyPrimaryButton(beauty?: boolean, extra?: string) {
  return cn(beauty && "beauty-btn-gradient border-0 shadow-sm", extra);
}

export function beautyOutlineButton(beauty?: boolean, extra?: string) {
  return cn(
    beauty && "border-primary/35 bg-primary/5 hover:bg-primary/10 hover:border-primary/50",
    extra,
  );
}

export function beautyPanel(beauty?: boolean, extra?: string) {
  return cn(beauty && "beauty-operational-panel", extra);
}

/** Panel surface dissolves into operational page background (beauty native skin). */
export function beautyAmbientPanel(beauty?: boolean, extra?: string) {
  return cn(
    beauty &&
      "beauty-operational-panel beauty-operational-panel--ambient bg-transparent shadow-none",
    extra,
  );
}

export function beautyListScroll(extra?: string) {
  return cn(
    "beauty-op-list-scroll divide-y divide-border/70 overscroll-contain",
    extra,
  );
}

/** Customers ambient list — soft dividers + bottom dissolve mask (beauty native skin). */
export function beautyCustomerListScroll(beauty?: boolean, extra?: string) {
  return cn(
    "beauty-op-list-scroll overscroll-contain",
    beauty ? "beauty-op-list-scroll--ambient divide-y-0" : "divide-y divide-border/70",
    extra,
  );
}

const BEAUTY_POST_SESSION_DRAFT_KEY = "livia.beautyPostSessionDraft";

export function stashBeautyPostSessionDraft(body: string) {
  try {
    sessionStorage.setItem(BEAUTY_POST_SESSION_DRAFT_KEY, body);
  } catch {
    /* sessionStorage unavailable */
  }
}

export function takeBeautyPostSessionDraft(): string | null {
  try {
    const value = sessionStorage.getItem(BEAUTY_POST_SESSION_DRAFT_KEY);
    if (value) sessionStorage.removeItem(BEAUTY_POST_SESSION_DRAFT_KEY);
    return value;
  } catch {
    return null;
  }
}

export function beautyRow(beauty?: boolean, attention?: boolean, extra?: string) {
  return cn(
    "flex items-center gap-3 p-3 transition-colors cursor-pointer",
    beauty ? "hover:bg-primary/6" : "hover:bg-muted/30",
    attention && beauty && "beauty-op-row--attention",
    extra,
  );
}
