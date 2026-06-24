import { inboxChannelLabel } from "@workspace/policy";
import { Feather, FontAwesome5 } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, View, type ViewStyle } from "react-native";

const SIZE = { xs: 12, sm: 14, md: 16 } as const;

type Props = {
  channel: string | null | undefined;
  size?: keyof typeof SIZE;
  style?: ViewStyle;
};

function BrandIcon({
  name,
  color,
  px,
}: {
  name: React.ComponentProps<typeof FontAwesome5>["name"];
  color: string;
  px: number;
}) {
  return <FontAwesome5 name={name} size={px} color={color} />;
}

export function InboxChannelIcon({ channel, size = "sm", style }: Props) {
  const px = SIZE[size];
  const label = inboxChannelLabel(channel);

  let icon: React.ReactNode;
  switch (channel) {
    case "WHATSAPP":
      icon = <BrandIcon name="whatsapp" color="#25D366" px={px} />;
      break;
    case "INSTAGRAM":
      icon = <BrandIcon name="instagram" color="#E4405F" px={px} />;
      break;
    case "MESSENGER":
      icon = <BrandIcon name="facebook-messenger" color="#0084FF" px={px} />;
      break;
    case "WEB":
      icon = <Feather name="globe" size={px} color="#94a3b8" />;
      break;
    case "SMS":
      icon = <Feather name="smartphone" size={px} color="#94a3b8" />;
      break;
    case "EMAIL":
      icon = <Feather name="mail" size={px} color="#94a3b8" />;
      break;
    case "VOICE":
      icon = <Feather name="phone" size={px} color="#94a3b8" />;
      break;
    default:
      icon = <Feather name="message-circle" size={px} color="#94a3b8" />;
  }

  return (
    <View
      accessibilityRole="image"
      accessibilityLabel={label}
      style={[styles.wrap, style]}
    >
      {icon}
    </View>
  );
}

export function InboxChannelIconRow({
  channels,
  size = "sm",
  style,
}: {
  channels: string[];
  size?: keyof typeof SIZE;
  style?: ViewStyle;
}) {
  if (channels.length === 0) return null;
  return (
    <View style={[styles.row, style]}>
      {channels.map((ch) => (
        <InboxChannelIcon key={ch} channel={ch} size={size} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", justifyContent: "center" },
  row: { flexDirection: "row", alignItems: "center", gap: 6 },
});
