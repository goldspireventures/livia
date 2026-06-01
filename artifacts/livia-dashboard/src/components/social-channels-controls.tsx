import { MessageCircle } from "lucide-react";
import { ChannelSetupWizard } from "@/components/channel-setup-wizard";
import { useBusiness } from "@/lib/business-context";

type MessagingChannels = {
  whatsapp?: { phoneNumberId: string; displayPhone?: string };
  instagram?: { pageId: string; igAccountId?: string };
  messenger?: { pageId: string };
};

type CommsExt = {
  metaWebhookUrl?: string | null;
  messagingChannels?: MessagingChannels;
  metaConfigured?: boolean;
  metaDevSimulate?: boolean;
  jurisdiction?: string;
  jurisdictionLabel?: string;
};

export function SocialChannelsControls({
  businessId,
  comms,
  onRefresh,
}: {
  businessId: string;
  comms: CommsExt | null;
  onRefresh: () => void;
}) {
  const { business } = useBusiness();
  const jurisdiction =
    comms?.jurisdiction ??
    (business && "country" in business ? (business as { country?: string }).country : undefined);

  return (
    <div
      className="space-y-4 rounded-lg border border-primary/20 bg-primary/5 p-4 mb-4"
      data-testid="social-channels-panel"
    >
      <div>
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <MessageCircle className="h-4 w-4 text-primary" />
          WhatsApp, Instagram & Messenger
        </h3>
        <p className="text-xs text-muted-foreground mt-1">
          Step-by-step setup — one Liv inbox for every DM and booking enquiry.
        </p>
      </div>
      <ChannelSetupWizard
        businessId={businessId}
        comms={comms}
        jurisdiction={jurisdiction}
        onRefresh={onRefresh}
      />
    </div>
  );
}
