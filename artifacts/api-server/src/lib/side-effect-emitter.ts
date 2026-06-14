/**
 * Fire-and-forget side effects — never block core tenant operations.
 */
import { logger } from "./logger";

export function fanOutSideEffect(
  label: string,
  fn: () => Promise<unknown>,
  context?: Record<string, unknown>,
): void {
  void fn().catch((err) => {
    logger.warn({ err, label, ...context }, "side effect failed (non-blocking)");
  });
}
