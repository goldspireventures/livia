import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { getApiPublicUrl } from "./public-urls";

const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);

const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/heic": "heic",
  "image/heif": "heif",
};

export function resolveUploadDir(): string {
  const configured = process.env.UPLOAD_DIR?.trim();
  if (configured) return path.resolve(configured);
  return path.resolve(process.cwd(), "uploads");
}

export function publicUploadBaseUrl(): string {
  const base = getApiPublicUrl();
  return `${base}/uploads`;
}

export function assertAllowedImageMime(mimeType: string): void {
  const m = mimeType.toLowerCase().split(";")[0]!.trim();
  if (!ALLOWED_MIME.has(m)) {
    throw new Error(`Unsupported image type: ${mimeType}`);
  }
}

export async function storeBusinessImageUpload(args: {
  businessId: string;
  buffer: Buffer;
  mimeType: string;
}): Promise<{ url: string; path: string }> {
  const { businessId, buffer, mimeType } = args;
  if (!/^[a-zA-Z0-9_-]+$/.test(businessId)) {
    throw new Error("Invalid business id");
  }
  assertAllowedImageMime(mimeType);
  const maxBytes = Number(process.env.UPLOAD_MAX_BYTES ?? 10 * 1024 * 1024);
  if (buffer.length > maxBytes) {
    throw new Error(`File too large (max ${maxBytes} bytes)`);
  }

  const ext = EXT_BY_MIME[mimeType.toLowerCase().split(";")[0]!.trim()] ?? "jpg";
  const hash = createHash("sha256").update(buffer).digest("hex").slice(0, 12);
  const filename = `${Date.now()}-${hash}.${ext}`;
  const rel = `${businessId}/${filename}`;
  const dir = resolveUploadDir();
  const full = path.join(dir, rel);
  await mkdir(path.dirname(full), { recursive: true });
  await writeFile(full, buffer);

  return {
    url: `${publicUploadBaseUrl()}/${rel.replace(/\\/g, "/")}`,
    path: rel,
  };
}
