import { cn } from "@/lib/utils";
import { inboxChannelLabel } from "@workspace/policy";
import { Globe, Mail, MessageSquare, Phone, PhoneCall } from "lucide-react";
import { SiInstagram, SiMessenger, SiWhatsapp } from "react-icons/si";

const SIZE = {
  xs: "h-3 w-3",
  sm: "h-3.5 w-3.5",
  md: "h-4 w-4",
} as const;

type InboxChannelIconSize = keyof typeof SIZE;

export function InboxChannelIcon({
  channel,
  size = "sm",
  className,
}: {
  channel: string | null | undefined;
  size?: InboxChannelIconSize;
  className?: string;
}) {
  const cls = cn(SIZE[size], className);
  const label = inboxChannelLabel(channel);

  const icon = (() => {
    switch (channel) {
      case "WHATSAPP":
        return <SiWhatsapp className={cn(cls, "text-[#25D366]")} aria-hidden />;
      case "INSTAGRAM":
        return <SiInstagram className={cn(cls, "text-[#E4405F]")} aria-hidden />;
      case "MESSENGER":
        return <SiMessenger className={cn(cls, "text-[#0084FF]")} aria-hidden />;
      case "WEB":
        return <Globe className={cls} aria-hidden />;
      case "SMS":
        return <Phone className={cls} aria-hidden />;
      case "EMAIL":
        return <Mail className={cls} aria-hidden />;
      case "VOICE":
        return <PhoneCall className={cls} aria-hidden />;
      default:
        return <MessageSquare className={cls} aria-hidden />;
    }
  })();

  return (
    <span role="img" aria-label={label} title={label} className="inline-flex shrink-0">
      {icon}
    </span>
  );
}

export function InboxChannelIconRow({
  channels,
  size = "sm",
  className,
}: {
  channels: string[];
  size?: InboxChannelIconSize;
  className?: string;
}) {
  if (channels.length === 0) return null;
  return (
    <span className={cn("inline-flex items-center gap-1", className)}>
      {channels.map((ch) => (
        <InboxChannelIcon key={ch} channel={ch} size={size} />
      ))}
    </span>
  );
}
