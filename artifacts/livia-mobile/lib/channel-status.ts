/** Mirrors dashboard channel-setup-guide — social channel connection flags. */

export type MessagingChannelsSnapshot = {
  whatsapp?: { phoneNumberId?: string; displayPhone?: string };
  instagram?: { pageId?: string; igAccountId?: string };
  messenger?: { pageId?: string };
};

export function channelConnectionStatus(channels: MessagingChannelsSnapshot | undefined): {
  whatsapp: boolean;
  instagram: boolean;
  messenger: boolean;
  anySocial: boolean;
} {
  const whatsapp = Boolean(channels?.whatsapp?.phoneNumberId?.trim());
  const instagram = Boolean(channels?.instagram?.pageId?.trim());
  const messenger = Boolean(channels?.messenger?.pageId?.trim());
  return {
    whatsapp,
    instagram,
    messenger,
    anySocial: whatsapp || instagram || messenger,
  };
}

export type CommsPayload = {
  twilioPhoneNumber?: string | null;
  resendFromAddress?: string | null;
  providerStatus?: { smsProvider?: string; emailProvider?: string };
  metaWebhookUrl?: string;
  metaConfigured?: boolean;
  metaDevSimulate?: boolean;
  messagingChannels?: MessagingChannelsSnapshot;
  jurisdictionLabel?: string;
  channelPack?: {
    whatsapp?: boolean;
    instagram?: boolean;
    messenger?: boolean;
    sms?: boolean;
  };
};
