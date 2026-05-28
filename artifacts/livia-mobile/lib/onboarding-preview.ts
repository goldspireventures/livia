import { getApiBaseUrl } from "@/lib/api-base";

export type OnboardingPreview = {
  vertical: string;
  aiGreeting: string;
  services: { name: string; durationMinutes: number; priceMinor: number }[];
};

export async function fetchOnboardingPreview(
  getToken: () => Promise<string | null>,
  args: {
    name: string;
    vertical: string;
    jurisdiction: string;
    tier?: string;
  },
): Promise<OnboardingPreview | null> {
  const token = await getToken();
  if (!token || args.name.trim().length < 2) return null;

  try {
    const res = await fetch(`${getApiBaseUrl()}/api/onboarding/preview`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(args),
    });
    if (!res.ok) return null;
    return (await res.json()) as OnboardingPreview;
  } catch {
    return null;
  }
}
