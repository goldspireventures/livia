import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, Loader2, Trash2 } from "lucide-react";

interface DemoDataControlsProps {
  variant?: "primary" | "settings";
  onSeeded?: () => void;
}

const baseUrl =
  (import.meta.env.BASE_URL || "/").replace(/\/$/, "") + "/api";

export default function DemoDataControls({ variant = "primary", onSeeded }: DemoDataControlsProps) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [isSeeding, setIsSeeding] = useState(false);
  const [isWiping, setIsWiping] = useState(false);

  async function loadDemo() {
    setIsSeeding(true);
    try {
      const res = await fetch(`${baseUrl}/dev/seed`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Seed failed");
      toast({
        title: "Demo data loaded",
        description: data.message ?? "Your workspace is ready to play with.",
      });
      qc.invalidateQueries();
      onSeeded?.();
      // Soft reload so the BusinessProvider picks up the new owned business
      setTimeout(() => window.location.reload(), 600);
    } catch (e: any) {
      toast({
        title: "Could not load demo data",
        description: e?.message ?? "Try again in a moment.",
        variant: "destructive",
      });
    } finally {
      setIsSeeding(false);
    }
  }

  async function wipeDemo() {
    if (
      !window.confirm(
        "Wipe ALL of your businesses and their data? This cannot be undone.",
      )
    )
      return;
    setIsWiping(true);
    try {
      const res = await fetch(`${baseUrl}/dev/seed`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Wipe failed");
      toast({
        title: "Workspace wiped",
        description: data.message ?? "All businesses and data removed.",
      });
      qc.invalidateQueries();
      setTimeout(() => window.location.reload(), 600);
    } catch (e: any) {
      toast({
        title: "Could not wipe data",
        description: e?.message ?? "Try again in a moment.",
        variant: "destructive",
      });
    } finally {
      setIsWiping(false);
    }
  }

  if (variant === "primary") {
    return (
      <Button
        size="lg"
        onClick={loadDemo}
        disabled={isSeeding}
        data-testid="button-load-demo-data"
        className="bg-gradient-to-r from-primary to-[hsl(var(--chart-1))] hover:opacity-90"
      >
        {isSeeding ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Loading demo workspace...
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4 mr-2" />
            Load demo data (3 businesses, 40+ bookings)
          </>
        )}
      </Button>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row gap-2">
      <Button
        variant="outline"
        onClick={loadDemo}
        disabled={isSeeding || isWiping}
        data-testid="button-reload-demo-data"
      >
        {isSeeding ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <Sparkles className="h-4 w-4 mr-2" />
        )}
        Reload demo data
      </Button>
      <Button
        variant="outline"
        onClick={wipeDemo}
        disabled={isSeeding || isWiping}
        data-testid="button-wipe-data"
        className="text-destructive hover:text-destructive"
      >
        {isWiping ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <Trash2 className="h-4 w-4 mr-2" />
        )}
        Wipe all my data
      </Button>
    </div>
  );
}
