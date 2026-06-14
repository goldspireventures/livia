import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Fixed Liv entry — appears after scrolling past hero (screen card liv_entry zone). */
export function PublicBookLivBar({
  visible,
  livActive,
  onOpenChat,
}: {
  visible: boolean;
  livActive?: boolean;
  onOpenChat: () => void;
}) {
  if (!visible) return null;

  return (
    <div
      className="fixed bottom-0 inset-x-0 z-40 flex justify-center px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 pointer-events-none"
      data-testid="public-book-liv-bar"
    >
      <Button
        type="button"
        variant="secondary"
        size="sm"
        className={`pointer-events-auto shadow-md border border-border/80 ${
          livActive ? "motion-liv-pulse" : ""
        }`}
        onClick={onOpenChat}
        data-testid="button-open-chat-bar"
      >
        <MessageCircle className="h-4 w-4 mr-1.5" aria-hidden />
        Chat with Liv
      </Button>
    </div>
  );
}
