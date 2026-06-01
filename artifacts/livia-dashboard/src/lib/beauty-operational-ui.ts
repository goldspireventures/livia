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

export function beautyListScroll(extra?: string) {
  return cn(
    "beauty-op-list-scroll divide-y divide-border/70 overscroll-contain",
    extra,
  );
}

export function beautyRow(beauty?: boolean, attention?: boolean, extra?: string) {
  return cn(
    "flex items-center gap-3 p-3 transition-colors cursor-pointer",
    beauty ? "hover:bg-primary/6" : "hover:bg-muted/30",
    attention && beauty && "beauty-op-row--attention",
    extra,
  );
}
