/** v3 motion tokens — see docs/design/motion-tokens.md */
export const MOTION = {
  enterPage: "animate-in fade-in slide-in-from-bottom-4 duration-500",
  enterPanel: "animate-in fade-in slide-in-from-right-4 duration-300",
  listItem: "animate-in fade-in duration-200",
} as const;

export function verticalToneClass(vertical?: string | null): string {
  switch (vertical) {
    case "medspa":
    case "allied-health":
      return "tone-calm";
    case "pet-grooming":
      return "tone-warm";
    case "body-art":
      return "tone-studio";
    default:
      return "tone-celebrate";
  }
}
