/** Full-bleed aurora atmosphere for onboarding portal (pointer-events none). */
export function OnboardingPortalAmbient() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div className="absolute left-1/2 top-[18%] h-[min(640px,70vh)] w-[min(640px,90vw)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-aurora-cyan/12 blur-[120px]" />
      <div className="absolute -right-24 top-1/3 h-[420px] w-[420px] rounded-full bg-aurora-violet/10 blur-[100px]" />
      <div className="absolute -left-16 bottom-0 h-[320px] w-[320px] rounded-full bg-aurum-champagne/8 blur-[90px]" />
      <div className="absolute inset-0 bg-gradient-to-b from-background/20 via-background/60 to-background" />
    </div>
  );
}
