import { businessVocabulary, type BusinessVertical } from "@workspace/policy";

/** Care programmes / day packages page — never show spa copy on allied health. */
export function careProgrammesPageCopy(
  vertical?: string | null,
  category?: string | null,
): { title: string; subtitle: string } {
  const key = businessVocabulary(vertical, category).vertical as BusinessVertical;
  switch (key) {
    case "allied-health":
      return {
        title: "Care programmes",
        subtitle:
          "Multi-visit treatment plans and bundled appointments — booked as one patient journey with clinician capacity checks.",
      };
    case "wellness":
    case "medspa":
      return {
        title: "Day spa packages",
        subtitle:
          "Multi-step itineraries — massage, facial, thermal — booked as one flow with room capacity checks.",
      };
    case "fitness":
      return {
        title: "Session bundles",
        subtitle: "Packaged class or PT blocks — one booking flow for members.",
      };
    default:
      return {
        title: "Programme packages",
        subtitle: "Multi-step service bundles booked as a single customer flow.",
      };
  }
}
