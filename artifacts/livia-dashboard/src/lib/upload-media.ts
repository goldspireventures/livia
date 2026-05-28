import { customFetch } from "@workspace/api-client-react";

export type UploadedImage = { url: string; mediaId: string };

export async function uploadImageFile(
  businessId: string,
  file: File,
  opts?: { entityType?: string; entityId?: string },
): Promise<UploadedImage> {
  const form = new FormData();
  form.append("file", file);
  if (opts?.entityType) form.append("entityType", opts.entityType);
  if (opts?.entityId) form.append("entityId", opts.entityId);

  const base = import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, "") ?? "";
  const res = await fetch(`${base}/api/businesses/${businessId}/uploads`, {
    method: "POST",
    credentials: "include",
    body: form,
  });
  if (!res.ok) {
    throw new Error(`Upload failed (${res.status})`);
  }
  return res.json() as Promise<UploadedImage>;
}

export async function uploadImageBase64(
  businessId: string,
  contentBase64: string,
  mimeType: string,
): Promise<UploadedImage> {
  return customFetch<UploadedImage>(`/api/businesses/${businessId}/uploads/base64`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contentBase64, mimeType }),
  });
}
