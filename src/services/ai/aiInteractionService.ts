import "server-only";

import type { Prisma } from "@prisma/client";
import { z } from "zod";

import { prisma } from "@/lib/prisma";

const RecordInput = z.object({
  businessId: z.string().min(1).optional().nullable(),
  userId: z.string().min(1).optional().nullable(),
  kind: z.string().min(1).max(80),
  model: z.string().min(1).max(80).optional().nullable(),
  promptSummary: z.string().max(500).optional().nullable(),
  responseSummary: z.string().max(2000).optional().nullable(),
  error: z.string().max(500).optional().nullable(),
  durationMs: z.number().int().min(0).optional().nullable(),
  metadata: z.any().optional().nullable(),
});

export async function recordAIInteraction(input: z.infer<typeof RecordInput>) {
  const p = RecordInput.parse(input);
  return prisma.aIInteraction.create({
    data: {
      businessId: p.businessId ?? undefined,
      userId: p.userId ?? undefined,
      kind: p.kind,
      model: p.model ?? undefined,
      promptSummary: p.promptSummary ?? undefined,
      responseSummary: p.responseSummary ?? undefined,
      error: p.error ?? undefined,
      durationMs: p.durationMs ?? undefined,
      metadata: p.metadata === undefined ? undefined : (p.metadata as Prisma.InputJsonValue),
    },
  });
}
