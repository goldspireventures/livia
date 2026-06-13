import { customFetch } from "@workspace/api-client-react";

export type MeProfile = {
  platformLegalAccepted?: boolean;
  platformLegalCurrent?: { tosVersion: string; privacyVersion: string };
};

export async function fetchMeProfile(): Promise<MeProfile> {
  return customFetch<MeProfile>("/api/me");
}

export async function acceptPlatformLegal(email?: string): Promise<MeProfile> {
  return customFetch<MeProfile>("/api/me/platform-legal", {
    method: "POST",
    body: JSON.stringify({
      accept: true,
      ...(email?.trim() ? { email: email.trim().toLowerCase() } : {}),
    }),
  });
}
