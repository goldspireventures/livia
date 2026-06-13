import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-fetch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { bookingAftercareAutoSendLine } from "@workspace/policy";
import { Sparkles } from "lucide-react";

type AftercareState = {
  status: string | null;
  sentAt: string | null;
  draftBody: string | null;
  mode: string | null;
};

export function BookingAftercarePanel({
  businessId,
  bookingId,
  status,
}: {
  businessId: string;
  bookingId: string;
  status: string;
}) {
  const { toast } = useToast();
  const [data, setData] = useState<AftercareState | null>(null);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (status !== "COMPLETED" || !businessId || !bookingId) return;
    void apiFetch<AftercareState>(
      `/businesses/${businessId}/bookings/${bookingId}/aftercare`,
    ).then((d) => {
      setData(d);
      setBody(d.draftBody ?? "");
    });
  }, [businessId, bookingId, status]);

  if (status !== "COMPLETED" || !data) return null;

  async function send() {
    setSending(true);
    try {
      await apiFetch(`/businesses/${businessId}/bookings/${bookingId}/aftercare/send`, {
        method: "POST",
        body: JSON.stringify({ body: body.trim() || undefined }),
      });
      toast({ title: "Aftercare sent — Liv resumes on replies" });
      const refreshed = await apiFetch<AftercareState>(
        `/businesses/${businessId}/bookings/${bookingId}/aftercare`,
      );
      setData(refreshed);
    } catch {
      toast({ title: "Could not send aftercare", variant: "destructive" });
    } finally {
      setSending(false);
    }
  }

  return (
    <Card data-testid="booking-aftercare-panel">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          Aftercare
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {data.sentAt ? (
          <p className="text-sm text-muted-foreground">
            Sent {new Date(data.sentAt).toLocaleString()}
          </p>
        ) : data.mode === "liv_draft" || data.status === "draft" ? (
          <>
            <p className="text-xs text-muted-foreground">
              Liv prepared aftercare — edit if needed, then send. Uses guest&apos;s preferred channel.
            </p>
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={4}
              data-testid="booking-aftercare-draft"
            />
            <Button
              size="sm"
              disabled={sending || !body.trim()}
              data-testid="booking-aftercare-send"
              onClick={() => void send()}
            >
              {sending ? "Sending…" : "Send aftercare"}
            </Button>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            {bookingAftercareAutoSendLine()}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
