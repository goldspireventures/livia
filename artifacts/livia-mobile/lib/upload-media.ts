import { getAuthTokenGetter } from "@workspace/api-client-react";
import * as ImagePicker from "expo-image-picker";
import { getApiBaseUrl } from "@/lib/api-base";

export type UploadedImage = { url: string; mediaId: string };

async function authHeaders(): Promise<Record<string, string>> {
  const getter = getAuthTokenGetter();
  const token = getter ? await getter() : null;
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

/** Upload a local file URI (camera roll or camera) via multipart. */
export async function uploadImageFromUri(
  businessId: string,
  uri: string,
  mimeType = "image/jpeg",
  opts?: { entityType?: string; entityId?: string },
): Promise<UploadedImage> {
  const form = new FormData();
  const name = `upload.${mimeType.includes("png") ? "png" : "jpg"}`;
  form.append("file", { uri, name, type: mimeType } as unknown as Blob);
  if (opts?.entityType) form.append("entityType", opts.entityType);
  if (opts?.entityId) form.append("entityId", opts.entityId);

  const res = await fetch(`${getApiBaseUrl()}/api/businesses/${businessId}/uploads`, {
    method: "POST",
    headers: await authHeaders(),
    body: form,
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(err.error ?? `Upload failed (${res.status})`);
  }
  return res.json() as Promise<UploadedImage>;
}

export async function pickImageAndUpload(
  businessId: string,
  source: "camera" | "library",
  opts?: { entityType?: string; entityId?: string },
): Promise<UploadedImage | null> {
  const perm =
    source === "camera"
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) {
    throw new Error(source === "camera" ? "Camera permission required" : "Photo library permission required");
  }

  const result =
    source === "camera"
      ? await ImagePicker.launchCameraAsync({
          mediaTypes: ["images"],
          quality: 0.85,
          allowsEditing: true,
        })
      : await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ["images"],
          quality: 0.85,
          allowsEditing: true,
        });

  if (result.canceled || !result.assets[0]) return null;
  const asset = result.assets[0];
  return uploadImageFromUri(
    businessId,
    asset.uri,
    asset.mimeType ?? "image/jpeg",
    opts,
  );
}
