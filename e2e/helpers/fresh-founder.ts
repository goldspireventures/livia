import { expect, type APIRequestContext } from "@playwright/test";
import { apiBase } from "./demo-auth";

export type FreshFounder = {
  email: string;
  password: string;
  token: string;
  userId: string;
  landingPath: string;
};

export async function provisionFreshSignupFounder(
  request: APIRequestContext,
  suffix = `pw-${Date.now()}`,
): Promise<FreshFounder> {
  const res = await request.post(`${apiBase}/api/dev/e2e/fresh-founder`, {
    data: { suffix },
  });
  expect(res.ok(), `fresh-founder: ${await res.text()}`).toBeTruthy();
  return (await res.json()) as FreshFounder;
}
