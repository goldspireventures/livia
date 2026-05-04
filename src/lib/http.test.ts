import { describe, expect, it } from "vitest";
import { z } from "zod";

import { AppError } from "@/lib/errors";
import { handleRouteError } from "@/lib/http";

describe("handleRouteError", () => {
  it("maps ZodError to 400 BAD_REQUEST", async () => {
    let caught: unknown;
    try {
      z.object({ name: z.string() }).parse({});
    } catch (e) {
      caught = e;
    }
    const res = handleRouteError(caught);
    expect(res.status).toBe(400);
    const body = (await res.json()) as { ok: boolean; error: { code: string } };
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe("BAD_REQUEST");
  });

  it("maps AppError to its status", async () => {
    const res = handleRouteError(new AppError("NOT_FOUND", "missing", 404));
    expect(res.status).toBe(404);
    const body = (await res.json()) as { ok: boolean; error: { code: string } };
    expect(body.error.code).toBe("NOT_FOUND");
  });
});
