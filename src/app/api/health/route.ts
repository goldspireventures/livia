import { NextResponse } from "next/server";

import { getHealthPayload } from "@/services/health";

export function GET() {
  return NextResponse.json(getHealthPayload(), { status: 200 });
}
