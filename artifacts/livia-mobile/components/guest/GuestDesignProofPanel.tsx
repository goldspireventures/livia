import { Feather } from "@expo/vector-icons";
import React, { useEffect, useMemo, useState } from "react";
import { Image, Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { fonts, type } from "@/constants/typography";
import { useColors } from "@/hooks/useColors";
import { getApiBaseUrl } from "@/lib/api-base";
import {
  canGuestReviewDesignProof,
  parseDesignProofGuestFeedback,
  sortDesignProofRevisionsAsc,
  stripDesignProofGuestFeedback,
  type DesignProofRevisionView,
} from "@workspace/policy";

export type GuestProofThread = {
  proofId: string;
  status: string;
  note: string | null;
  imageUrl?: string | null;
  reviewUrl: string;
  version?: number;
  versions?: DesignProofRevisionView[];
};

function proofTitle(note?: string | null): string {
  const raw = stripDesignProofGuestFeedback(note) || "Studio design";
  const idx = raw.indexOf(" — ");
  return idx > 0 ? raw.slice(0, idx) : raw;
}

function proofSubtitle(note?: string | null): string | null {
  const raw = stripDesignProofGuestFeedback(note);
  if (!raw) return null;
  const idx = raw.indexOf(" — ");
  return idx > 0 ? raw.slice(idx + 3) : null;
}

function statusLabel(status: string): string {
  if (status === "rejected") return "Changes requested";
  return status.replace(/_/g, " ");
}

/** Single canvas + centered version nav — parity with web `DesignProofVersionFrame`. */
export function GuestDesignProofPanel({
  proof,
  hubToken,
  shopSlug,
  accent,
}: {
  proof: GuestProofThread;
  hubToken: string;
  shopSlug: string;
  accent: string;
}) {
  const colors = useColors();
  const api = getApiBaseUrl();
  const [fetchedVersions, setFetchedVersions] = useState<DesignProofRevisionView[] | null>(null);
  const [liveImageUrl, setLiveImageUrl] = useState<string | null | undefined>(proof.imageUrl);

  useEffect(() => {
    if (!hubToken || !shopSlug || !proof.proofId) return;
    void fetch(
      `${api}/api/public/guest-hub/shops/${encodeURIComponent(shopSlug)}/proofs/${encodeURIComponent(proof.proofId)}/versions`,
      { headers: { "X-Guest-Hub-Token": hubToken } },
    )
      .then(async (r) => {
        if (!r.ok) return null;
        return r.json() as Promise<{
          imageUrl: string | null;
          versions: DesignProofRevisionView[];
        }>;
      })
      .then((payload) => {
        if (!payload?.versions?.length) return;
        setFetchedVersions(payload.versions);
        if (payload.imageUrl) setLiveImageUrl(payload.imageUrl);
      })
      .catch(() => undefined);
  }, [api, hubToken, proof.proofId, shopSlug]);

  const versions = useMemo(() => {
    const source =
      fetchedVersions?.length
        ? fetchedVersions
        : proof.versions?.length
          ? proof.versions
          : [{ version: proof.version ?? 1, imageUrl: liveImageUrl ?? proof.imageUrl ?? null }];
    return sortDesignProofRevisionsAsc(source);
  }, [fetchedVersions, liveImageUrl, proof.imageUrl, proof.version, proof.versions]);

  const [idx, setIdx] = useState(() => Math.max(0, versions.length - 1));

  useEffect(() => {
    setIdx(Math.max(0, versions.length - 1));
  }, [proof.proofId, versions.length]);

  const current = versions[idx] ?? versions[versions.length - 1]!;
  const latestVersion = versions[versions.length - 1]!.version;
  const isLatest = idx === versions.length - 1;
  const canReview = canGuestReviewDesignProof(proof.status, isLatest);
  const artSrc = current.imageUrl || liveImageUrl || proof.imageUrl;
  const guestNote = parseDesignProofGuestFeedback(proof.note);

  return (
    <View style={[styles.card, { borderColor: accent + "55", backgroundColor: colors.card }]} testID="guest-design-proof-panel">
      <Text style={[type.caption, { color: accent, letterSpacing: 1, textTransform: "uppercase" }]}>
        Design proof
      </Text>
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={[type.body, { fontFamily: fonts.bodyMed, color: colors.foreground }]}>
            {proofTitle(proof.note)}
          </Text>
          {proofSubtitle(proof.note) ? (
            <Text style={[type.caption, { color: colors.mutedForeground, marginTop: 2 }]}>
              {proofSubtitle(proof.note)}
            </Text>
          ) : null}
        </View>
        <View style={[styles.badge, { backgroundColor: colors.muted + "44" }]}>
          <Text style={[type.caption, { color: colors.foreground }]}>{statusLabel(proof.status)}</Text>
        </View>
      </View>

      {guestNote ? (
        <Text style={[type.caption, { color: colors.mutedForeground, marginTop: 6 }]}>
          Your note: {guestNote}
        </Text>
      ) : null}

      <View style={[styles.frame, { borderColor: colors.border, backgroundColor: colors.background }]}>
        {artSrc ? (
          <Image source={{ uri: artSrc }} style={styles.art} resizeMode="contain" />
        ) : (
          <View style={[styles.art, styles.artEmpty, { backgroundColor: accent + "12" }]}>
            <Feather name="image" size={28} color={accent} />
          </View>
        )}

        <View style={styles.versionNav} testID="guest-proof-version-nav">
          <Pressable
            onPress={() => setIdx((i) => Math.max(0, i - 1))}
            disabled={idx <= 0}
            style={[styles.navBtn, { borderColor: colors.border, opacity: idx <= 0 ? 0.35 : 1 }]}
            accessibilityLabel="Previous version"
            testID="guest-proof-version-prev"
          >
            <Feather name="chevron-left" size={18} color={colors.foreground} />
          </Pressable>
          <Text style={[type.caption, { color: colors.mutedForeground, fontVariant: ["tabular-nums"] }]}>
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
            accessibilityLabel="Next version"
            testID="guest-proof-version-next"
          >
            <Feather name="chevron-right" size={18} color={colors.foreground} />
          </Pressable>
        </View>
      </View>

      {!isLatest ? (
        <Text style={[type.caption, { color: colors.mutedForeground, textAlign: "center", marginTop: 6 }]}>
          View only — older version
        </Text>
      ) : null}

      {canReview ? (
        <Pressable
          style={[styles.reviewBtn, { backgroundColor: accent }]}
          onPress={() => void Linking.openURL(proof.reviewUrl)}
          testID="guest-proof-review-cta"
        >
          <Text style={[type.body, { color: "#0f172a", fontFamily: fonts.bodyMed }]}>Review & approve</Text>
        </Pressable>
      ) : isLatest && proof.status === "rejected" ? (
        <Text style={[type.caption, { color: colors.mutedForeground, textAlign: "center", marginTop: 8 }]}>
          You asked for changes — the team is revising the artwork.
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginTop: 16,
    gap: 8,
  },
  headerRow: { flexDirection: "row", alignItems: "flex-start", gap: 8, marginTop: 4 },
  badge: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4 },
  frame: { borderWidth: 1, borderRadius: 12, padding: 10, marginTop: 4 },
  art: { width: "100%", height: 220, borderRadius: 8 },
  artEmpty: { alignItems: "center", justifyContent: "center" },
  versionNav: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  reviewBtn: { borderRadius: 10, padding: 12, alignItems: "center", marginTop: 8 },
});
