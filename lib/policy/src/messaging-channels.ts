import { z } from "zod/v4";

export const whatsappChannelConfigSchema = z.object({
  phoneNumberId: z.string().min(1),
  displayPhone: z.string().optional(),
  wabaId: z.string().optional(),
});

export const instagramChannelConfigSchema = z.object({
  pageId: z.string().min(1),
  igAccountId: z.string().optional(),
});

export const messengerChannelConfigSchema = z.object({
  pageId: z.string().min(1),
});

export const messagingChannelsSchema = z.object({
  whatsapp: whatsappChannelConfigSchema.optional(),
  instagram: instagramChannelConfigSchema.optional(),
  messenger: messengerChannelConfigSchema.optional(),
});

export type MessagingChannels = z.infer<typeof messagingChannelsSchema>;

export function parseMessagingChannels(raw: unknown): MessagingChannels {
  const r = messagingChannelsSchema.safeParse(raw ?? {});
  return r.success ? r.data : {};
}
