import { getDashboardUrl } from "./public-urls";

export function getPublicAppOrigin(): string {
  return getDashboardUrl().replace(/\/+$/, "");
}
