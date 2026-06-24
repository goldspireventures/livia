import React from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated from "react-native-reanimated";
import { runOnJS } from "react-native-reanimated";

const SWIPE_THRESHOLD = 36;

type InboxReplyChannelMessageProps = {
  children: React.ReactNode;
  enabled: boolean;
  selected: boolean;
  accent: string;
  onSelectChannel: () => void;
  style?: StyleProp<ViewStyle>;
};

/** Horizontal swipe on a message selects that channel for the owner reply (mobile). */
export function InboxReplyChannelMessage({
  children,
  enabled,
  selected,
  accent,
  onSelectChannel,
  style,
}: InboxReplyChannelMessageProps) {
  const pan = Gesture.Pan()
    .activeOffsetX([-14, 14])
    .failOffsetY([-12, 12])
    .enabled(enabled)
    .onEnd((e) => {
      if (Math.abs(e.translationX) >= SWIPE_THRESHOLD) {
        runOnJS(onSelectChannel)();
      }
    });

  if (!enabled) {
    return <View style={style}>{children}</View>;
  }

  return (
    <GestureDetector gesture={pan}>
      <Animated.View
        style={[
          style,
          selected && {
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: accent + "88",
            borderRadius: 16,
            backgroundColor: accent + "12",
          },
        ]}
      >
        {children}
      </Animated.View>
    </GestureDetector>
  );
}
