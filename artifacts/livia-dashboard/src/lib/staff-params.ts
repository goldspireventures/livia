import type { ListStaffParams } from "@workspace/api-client-react";

/** Pass `serviceId` until OpenAPI codegen includes it on ListStaffParams. */
export function staffListParams(opts: {
  isActive?: boolean;
  serviceId?: string;
}): ListStaffParams & { serviceId?: string } {
  return opts;
}
