import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { KeyRound, Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useBusiness } from "@/lib/business-context";
import { useAuth } from "@clerk/clerk-react";
import {
  dismissKeysRitual,
  fetchUserLifecycle,
  isKeysRitualDismissed,
  type PendingRitual,
} from "@/lib/lifecycle-api";
import { PERSONA_RITUALS } from "@/lib/persona-rituals";

export function KeysChangedRitual() {
  const { userId } = useAuth();
  const { business, setBusinessById } = useBusiness();
  const [, navigate] = useLocation();
  const [ritual, setRitual] = useState<PendingRitual | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!userId) return;
    void fetchUserLifecycle().then((data) => {
      const pending = data.pendingRituals?.find(
        (r) => r.type === "keys_changed" && !isKeysRitualDismissed(r.businessId),
      );
      if (pending) {
        setRitual(pending);
        setOpen(true);
      }
    });
  }, [userId]);

  if (!ritual) return null;

  const ownerRitual = PERSONA_RITUALS.owner;

  const onContinue = () => {
    dismissKeysRitual(ritual.businessId);
    setOpen(false);
    if (business?.id !== ritual.businessId) {
      setBusinessById(ritual.businessId);
    }
    navigate(ownerRitual.homePath);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-serif text-xl">
            <KeyRound className="h-5 w-5 text-primary" />
            You hold the keys now
          </DialogTitle>
          <DialogDescription className="text-left leading-relaxed">
            Ownership of this business transferred to you. Billing, AI settings, team invites, and
            approvals are yours — the same building, a different set of keys.
          </DialogDescription>
        </DialogHeader>
        <ul className="text-sm text-muted-foreground space-y-2 list-disc list-inside">
          <li>Review billing and plan in Settings</li>
          <li>Tune Liv&apos;s voice and cap ladder for how you run the floor</li>
          <li>Invite or adjust managers — never share your login</li>
        </ul>
        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-violet-400" />
          {ownerRitual.livFallback}
        </p>
        <DialogFooter>
          <Button variant="outline" onClick={() => { dismissKeysRitual(ritual.businessId); setOpen(false); }}>
            Remind me later
          </Button>
          <Button onClick={onContinue}>Open {ownerRitual.homeTitle}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
