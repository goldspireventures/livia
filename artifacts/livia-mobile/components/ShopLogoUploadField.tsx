import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { fonts } from "@/constants/typography";
import { pickImageAndUpload } from "@/lib/upload-media";

type Props = {
  businessId: string;
  logoUrl?: string | null;
  canEdit: boolean;
  onUploaded: (url: string | null) => void | Promise<void>;
};

export function ShopLogoUploadField({ businessId, logoUrl, canEdit, onUploaded }: Props) {
  const colors = useColors();
  const [uploading, setUploading] = useState(false);

  async function uploadFrom(source: "library" | "camera") {
    if (!canEdit || uploading) return;
    setUploading(true);
    try {
      const result = await pickImageAndUpload(businessId, source, { entityType: "business" });
      if (result?.url) await onUploaded(result.url);
    } catch (e) {
      Alert.alert("Upload failed", e instanceof Error ? e.message : "Try again.");
    } finally {
      setUploading(false);
    }
  }

  function pickSource() {
    Alert.alert("Shop logo", "Choose a photo for your booking page.", [
      { text: "Photo library", onPress: () => void uploadFrom("library") },
      { text: "Camera", onPress: () => void uploadFrom("camera") },
      { text: "Cancel", style: "cancel" },
    ]);
  }

  return (
    <View style={styles.wrap}>
      <Text style={[styles.label, { color: colors.mutedForeground }]}>Shop logo</Text>
      <View style={styles.row}>
        <View style={[styles.preview, { borderColor: colors.border, backgroundColor: colors.card }]}>
          {logoUrl ? (
            <Image source={{ uri: logoUrl }} style={styles.previewImg} resizeMode="contain" />
          ) : (
            <Feather name="image" size={22} color={colors.mutedForeground} />
          )}
        </View>
        <View style={styles.actions}>
          {canEdit ? (
            <>
              <Pressable
                onPress={pickSource}
                disabled={uploading}
                style={[styles.btn, { borderColor: colors.border, backgroundColor: colors.card }]}
              >
                {uploading ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <>
                    <Feather name="upload" size={14} color={colors.primary} />
                    <Text style={[styles.btnText, { color: colors.primary }]}>
                      {logoUrl ? "Replace logo" : "Upload logo"}
                    </Text>
                  </>
                )}
              </Pressable>
              {logoUrl ? (
                <Pressable
                  onPress={() => void onUploaded(null)}
                  disabled={uploading}
                  style={styles.removeBtn}
                >
                  <Text style={[styles.removeText, { color: colors.mutedForeground }]}>Remove</Text>
                </Pressable>
              ) : null}
            </>
          ) : (
            <Text style={[styles.readonly, { color: colors.foreground }]}>{logoUrl ? "Set" : "—"}</Text>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 8, gap: 6 },
  label: { fontFamily: fonts.body, fontSize: 12 },
  row: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  preview: {
    width: 64,
    height: 64,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  previewImg: { width: "100%", height: "100%" },
  actions: { flex: 1, gap: 6 },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  btnText: { fontFamily: fonts.bodySemi, fontSize: 13 },
  removeBtn: { paddingVertical: 4 },
  removeText: { fontFamily: fonts.body, fontSize: 12 },
  readonly: { fontFamily: fonts.body, fontSize: 14 },
});
