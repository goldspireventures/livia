import type { JurisdictionCode } from "./types";

export type RegulatoryOverlay = {
  jurisdiction: JurisdictionCode;
  /** Short lines shown on public booking / marketing footers */
  footerLines: string[];
  /** Cookie / privacy hint where required */
  privacyHint?: string;
};

export function getRegulatoryOverlay(
  jurisdiction: JurisdictionCode,
  business: { name: string; city?: string | null; email?: string | null },
): RegulatoryOverlay {
  const loc = [business.name, business.city].filter(Boolean).join(" · ");
  switch (jurisdiction) {
    case "DE":
      return {
        jurisdiction: "DE",
        footerLines: [
          loc ? `Anbieter: ${loc}` : `Anbieter: ${business.name}`,
          business.email ? `Kontakt: ${business.email}` : "Kontakt: siehe Impressum auf der Website des Studios",
          "KI-Assistent: Liv unterstützt die Buchung; ein Mensch kann jederzeit übernehmen.",
          "Marketing-SMS nur mit gesonderter Einwilligung (DSGVO).",
        ],
        privacyHint:
          "Mit der Buchung werden Ihre Angaben zur Terminabwicklung verarbeitet. Details in der Datenschutzerklärung des Studios.",
      };
    case "FR":
      return {
        jurisdiction: "FR",
        footerLines: [
          loc ? `Éditeur : ${loc}` : `Éditeur : ${business.name}`,
          "Assistant IA Liv pour la réservation ; une personne peut intervenir à tout moment.",
          "SMS marketing avec consentement séparé (RGPD).",
        ],
        privacyHint: "Vos données sont traitées pour la gestion du rendez-vous selon la politique du salon.",
      };
    case "ES":
      return {
        jurisdiction: "ES",
        footerLines: [
          loc ? `Responsable: ${loc}` : `Responsable: ${business.name}`,
          "Asistente de IA: Liv ayuda a reservar; una persona puede intervenir en cualquier momento.",
        ],
        privacyHint: "Sus datos se usan para gestionar la cita según la política del negocio.",
      };
    case "GB":
      return {
        jurisdiction: "GB",
        footerLines: [
          `Bookings processed by ${business.name}${business.city ? ` (${business.city})` : ""}.`,
          "AI assistant Liv helps schedule; a human can take over at any time.",
          "Promotional SMS requires separate consent (PECR).",
        ],
      };
    default:
      return {
        jurisdiction,
        footerLines: [
          `Bookings for ${business.name}${business.city ? ` · ${business.city}` : ""}.`,
          "Liv is an AI booking assistant; staff can take over any thread.",
          "Marketing messages require separate opt-in where applicable.",
        ],
      };
  }
}
