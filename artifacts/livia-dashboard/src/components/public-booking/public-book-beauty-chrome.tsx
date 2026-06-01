import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

/** W5 beauty preset — dual CTA row + trust footer (noir-dusk mock). */
export function PublicBookBeautyDualCta({
  onBook,
  onChat,
  bookLabel,
  showChat,
  bookDisabled,
}: {
  onBook: () => void;
  onChat?: () => void;
  bookLabel: string;
  showChat?: boolean;
  bookDisabled?: boolean;
}) {
  return (
    <div className="beauty-public-dual-cta" data-testid="public-beauty-dual-cta">
      {showChat && onChat ? (
        <Button
          type="button"
          variant="outline"
          className="beauty-btn-outline min-h-[44px] rounded-xl"
          onClick={onChat}
          data-testid="button-open-chat-beauty"
        >
          <MessageCircle className="h-4 w-4 mr-2" aria-hidden />
          Chat with Liv
        </Button>
      ) : (
        <span aria-hidden />
      )}
      <Button
        type="button"
        className="beauty-btn-gradient min-h-[44px] rounded-xl shadow-md"
        onClick={onBook}
        disabled={bookDisabled}
        data-testid="button-book-now-beauty"
      >
        {bookLabel}
      </Button>
    </div>
  );
}

export function PublicBookBeautyTrustFooter({
  cancelWindowHours,
}: {
  cancelWindowHours?: number | null;
}) {
  const cancelLabel =
    cancelWindowHours != null && cancelWindowHours > 0
      ? `Free cancellation ${cancelWindowHours}h`
      : "Free cancellation 24h";
  const items = ["No login required", "Secure booking", cancelLabel];
  return (
    <footer className="beauty-public-trust-footer" data-testid="public-beauty-trust-footer">
      {items.map((t, i) => (
        <span key={t}>
          {i > 0 ? <span className="opacity-40"> · </span> : null}
          {t}
        </span>
      ))}
    </footer>
  );
}
