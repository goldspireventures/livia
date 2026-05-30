import { dark } from "@clerk/themes";

/** Gateway sign-in/sign-up — email + password only; no Google OAuth in UI. */
export function clerkGatewayAppearance(theme: string | undefined) {
  return {
    baseTheme: theme === "dark" ? dark : undefined,
    elements: {
      formButtonPrimary: "bg-primary hover:bg-primary/90 text-primary-foreground",
      card: "bg-card/80 backdrop-blur-xl border border-border shadow-xl",
      socialButtonsRoot: "hidden",
      dividerRow: "hidden",
    },
  };
}
