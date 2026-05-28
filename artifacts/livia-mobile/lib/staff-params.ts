import type { ListStaffParams } from "@workspace/api-client-react";

export function staffListParams(opts: {
  isActive?: boolean;
  serviceId?: string;
}): ListStaffParams & { serviceId?: string } {
  return opts;
}
