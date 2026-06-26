import { useEffect, useState } from "react";

type SignupGateMode = "open" | "invite" | "closed";

/** Closed-beta notice on gateway sign-up (reads public API — no auth). */
export function BetaSignupNotice() {
  const [mode, setMode] = useState<SignupGateMode | null>(null);

  useEffect(() => {
    void fetch("/api/public/signup-gate")
      .then((r) => r.json())
      .then((j: { mode?: SignupGateMode }) => setMode(j.mode ?? "open"))
      .catch(() => setMode(null));
  }, []);

  if (mode !== "invite" && mode !== "closed") return null;

  return (
    <p className="rounded-lg border border-primary/15 bg-primary/5 px-3 py-2 text-xs text-muted-foreground text-center">
      {mode === "closed"
        ? "New shop sign-ups are paused. Join the waitlist at livia-hq.com if you do not have an invite."
        : "Closed beta — you need an invite email to create a new shop. Team invites from your manager still work."}
    </p>
  );
}
