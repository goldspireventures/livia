import { Link } from "wouter";
import { Users } from "lucide-react";
import { isDemoLoginEnabled } from "@/lib/persona";

/** Persistent escape hatch to hop personas (docs/demo-gateway.md). */
export function DemoPersonaChip() {
  if (!isDemoLoginEnabled) return null;
  return (
    <Link href="/demo/founder">
      <span
        className="fixed bottom-4 right-4 z-50 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-background/90 backdrop-blur px-3 py-2 text-xs font-medium shadow-lg hover:border-primary transition-colors"
        data-testid="demo-persona-chip"
      >
        <Users className="h-3.5 w-3.5 text-primary" />
        Switch persona
      </span>
    </Link>
  );
}
