import React from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ActNotificationBanner } from "@/components/ActNotificationBanner";
import { OwnerLivAssistFab } from "@/components/OwnerLivAssistFab";
import { useBusiness } from "@/contexts/BusinessContext";
import { usePersona } from "@/hooks/usePersona";
import { useTenantExperience } from "@/hooks/useTenantExperience";
import type { OperatorExperiencePack } from "@workspace/policy";

/**
 * Global signed-in chrome — Liv act toasts + owner assist FAB on every tab.
 * Parity with web `LivNotificationToastBridge` + shell-level Liv assist.
 */
export function MobileOperatorChrome() {
  const insets = useSafeAreaInsets();
  const { currentBusiness } = useBusiness();
  const { kind } = usePersona();
  const { data: tenantXp } = useTenantExperience(currentBusiness?.id);
  const operatorXp = (tenantXp as { operatorExperience?: OperatorExperiencePack } | null)?.operatorExperience;
  const ownerLike = kind === "owner" || kind === "org_admin";

  return (
    <>
      <View
        style={[styles.toastHost, { top: insets.top + 6 }]}
        pointerEvents="box-none"
        testID="mobile-operator-toast-host"
      >
        <ActNotificationBanner />
      </View>
      {ownerLike && currentBusiness?.id ? (
        <OwnerLivAssistFab
          businessId={currentBusiness.id}
          starters={operatorXp?.livOpsStarters ?? []}
          soloMode={operatorXp?.soloMode}
        />
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  toastHost: {
    position: "absolute",
    left: 0,
    right: 0,
    zIndex: 60,
    paddingHorizontal: 12,
  },
});
