import { useEffect, useRef, type ReactNode } from "react";
import { applyPresentationTheme } from "@/lib/experience-theme";
import type { SignInAppearanceHint } from "@/lib/sign-in-appearance-hint";
import { cn } from "@/lib/utils";

export function SignInTenantPreview({
  hint,
  loading,
  children,
}: {
  hint: SignInAppearanceHint | null;
  loading?: boolean;
  children: ReactNode;
}) {
  const shellRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = shellRef.current;
    if (!el) return;
    if (!hint?.cssPreset) {
      applyPresentationTheme({ root: el });
      return;
    }
    applyPresentationTheme({
      root: el,
      cssPreset: hint.cssPreset,
      brandAccentHex: hint.brandAccentHex,
    });
    return () => applyPresentationTheme({ root: el });
  }, [hint?.cssPreset, hint?.brandAccentHex]);

  return (
    <div
      ref={shellRef}
      className={cn(
        "sign-in-tenant-preview rounded-2xl border transition-[border-color,background-color,box-shadow] duration-500 ease-out",
        hint
          ? "border-primary/25 shadow-lg shadow-primary/5"
          : "border-border/50 bg-card/30 backdrop-blur-sm",
        hint?.colorMode === "dark" && "text-foreground",
      )}
      data-testid="sign-in-tenant-preview"
    >
      {hint ? (
        <div
          className="flex items-center gap-3 border-b border-border/50 px-4 py-3 animate-in fade-in duration-500"
          data-testid="sign-in-tenant-preview-banner"
        >
          {hint.logoUrl ? (
            <img
              src={hint.logoUrl}
              alt=""
              className="h-10 w-10 rounded-lg object-cover ring-1 ring-border/60"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15 text-xs font-semibold text-primary">
              {hint.businessName.slice(0, 2).toUpperCase()}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate">{hint.businessName}</p>
            <p className="text-[11px] text-muted-foreground truncate">
              {loading ? "Loading your workspace…" : `${hint.presetLabel} · preview`}
            </p>
          </div>
        </div>
      ) : null}
      <div className={cn("p-1", hint && "pt-0")}>{children}</div>
    </div>
  );
}
