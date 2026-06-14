import { Feather } from "@expo/vector-icons";
import React, { useEffect, useMemo, useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { fonts, type } from "@/constants/typography";
import { useColors } from "@/hooks/useColors";
import {
  listDesignProofRevisions,
  patchDesignProof,
  type DesignProofRevisionRow,
} from "@/lib/design-proofs-api";
import { sortDesignProofRevisionsAsc } from "@workspace/policy";

export function DesignProofVersionBar({
  businessId,
  proofId,
  version,
  imageUrl,
  accent,
  onReverted,
}: {
  businessId: string;
  proofId: string;
  version?: number;
  imageUrl?: string | null;
  accent: string;
  onReverted?: () => void;
}) {
  const colors = useColors();
  const [revisions, setRevisions] = useState<DesignProofRevisionRow[]>([]);
  const [idx, setIdx] = useState(0);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void listDesignProofRevisions(businessId, proofId)
      .then(setRevisions)
      .catch(() => setRevisions([]));
  }, [businessId, proofId, version]);

  const versions = useMemo(() => {
    const source =
      revisions.length > 0
        ? revisions
        : [{ version: version ?? 1, imageUrl: imageUrl ?? null, createdAt: "" }];
    return sortDesignProofRevisionsAsc(source);
  }, [imageUrl, revisions, version]);

  useEffect(() => {
    setIdx(Math.max(0, versions.length - 1));
  }, [proofId, versions.length, version]);

  const current = versions[idx] ?? versions[versions.length - 1]!;
  const latestVersion = versions[versions.length - 1]!.version;
  const isLatest = idx === versions.length - 1;
  const preview = current.imageUrl || imageUrl;

  async function restoreVersion() {
    setBusy(true);
    try {
      await patchDesignProof(businessId, proofId, {
        revertToVersion: current.version,
        resendAfterRevert: true,
      });
      onReverted?.();
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.wrap} testID="proof-desk-version-frame">
      {preview ? (
        <Image source={{ uri: preview }} style={styles.preview} resizeMode="contain" />
      ) : null}
      <View style={styles.nav} testID="proof-desk-version-nav">
        <Pressable
          onPress={() => setIdx((i) => Math.max(0, i - 1))}
          disabled={idx <= 0}
          style={[styles.navBtn, { borderColor: colors.border, opacity: idx <= 0 ? 0.35 : 1 }]}
          testID="proof-desk-version-prev"
        >
          <Feather name="chevron-left" size={16} color={colors.foreground} />
        </Pressable>
        <Text style={[type.caption, { color: colors.mutedForeground }]}>
          v{current.version}
          {latestVersion > 1 ? ` / v${latestVersion}` : ""}
        </Text>
        <Pressable
          onPress={() => setIdx((i) => Math.min(versions.length - 1, i + 1))}
          disabled={idx >= versions.length - 1}
          style={[
            styles.navBtn,
            { borderColor: colors.border, opacity: idx >= versions.length - 1 ? 0.35 : 1 },
          ]}
          testID="proof-desk-version-next"
        >
          <Feather name="chevron-right" size={16} color={colors.foreground} />
        </Pressable>
      </View>
      {!isLatest ? (
        <Pressable
          onPress={() => void restoreVersion()}
          disabled={busy}
          style={[styles.restoreBtn, { borderColor: accent, opacity: busy ? 0.6 : 1 }]}
          testID="proof-desk-revert-version"
        >
          <Text style={{ color: accent, fontFamily: fonts.bodySemi, fontSize: 12 }}>
            Restore v{current.version} as new version
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 10, gap: 8 },
  preview: { width: "100%", height: 160, borderRadius: 8, backgroundColor: "#f3efe6" },
  nav: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 12 },
  navBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  restoreBtn: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    alignItems: "center",
  },
});
