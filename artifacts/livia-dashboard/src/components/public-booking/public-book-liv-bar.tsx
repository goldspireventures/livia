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
      className="fixed bottom-0 inset-x-0 z-40 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-2 bg-gradient-to-t from-background via-background/95 to-transparent pointer-events-none"
      data-testid="public-book-liv-bar"
    >
      <Button
        type="button"
        variant="secondary"
        className={`w-full max-w-xl mx-auto pointer-events-auto min-h-[56px] shadow-lg border border-border/80 ${
          livActive ? "motion-liv-pulse" : ""
        }`}
        onClick={onOpenChat}
        data-testid="button-open-chat-bar"
      >
        <MessageCircle className="h-4 w-4 mr-2" aria-hidden />
        Chat with Liv
      </Button>
    </div>
  );
}
