import { customFetch } from "@workspace/api-client-react";

export type SeedDevWorkspaceResponse = {
  message?: string;
  error?: string;
  businesses?: Array<{ id?: string; name: string; slug: string }>;
};

/** POST /api/dev/seed — uses Clerk token + API base from app _layout. */
export function seedDevWorkspace() {
  return customFetch<SeedDevWorkspaceResponse>("/api/dev/seed", { method: "POST" });
}
