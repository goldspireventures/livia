import { NextResponse } from "next/server";
import { z } from "zod";

import { AppError } from "@/lib/errors";

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ ok: true, data }, { status: 200, ...init });
}

export function created<T>(data: T) {
  return NextResponse.json({ ok: true, data }, { status: 201 });
}

export function fail(code: string, message: string, status = 400) {
  return NextResponse.json(
    { ok: false, error: { code, message } },
    { status },
  );
}

export function handleRouteError(err: unknown) {
  if (err instanceof AppError) {
    return fail(err.code, err.message, err.status);
  }
  if (err instanceof z.ZodError) {
    return fail("BAD_REQUEST", err.issues[0]?.message ?? "Invalid input", 400);
  }
  console.error("Unhandled route error", err);
  return fail("INTERNAL", "Unexpected error", 500);
}

