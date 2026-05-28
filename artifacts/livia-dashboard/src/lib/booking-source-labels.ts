import { Globe, MessageCircle, Phone, User, Footprints, Mail, Instagram } from "lucide-react";

export function bookingSourceLabel(source?: string | null): string {
  switch (source) {
    case "web":
      return "Public website";
    case "voice":
      return "Phone (Liv)";
    case "whatsapp":
      return "WhatsApp";
    case "sms":
      return "SMS";
    case "instagram":
      return "Instagram DM";
    case "messenger":
      return "Messenger";
    case "email":
      return "Email";
    case "walk-in":
      return "Walk-in";
    case "owner-manual":
      return "Added by team";
    case "google-cal-import":
      return "Calendar import";
    default:
      return source ? source.replace(/-/g, " ") : "Unknown";
  }
}

export function bookingSourceIcon(source?: string | null) {
  switch (source) {
    case "web":
      return Globe;
    case "voice":
      return Phone;
    case "whatsapp":
    case "sms":
    case "messenger":
      return MessageCircle;
    case "instagram":
      return Instagram;
    case "email":
      return Mail;
    case "walk-in":
      return Footprints;
    case "owner-manual":
      return User;
    default:
      return Globe;
  }
}
