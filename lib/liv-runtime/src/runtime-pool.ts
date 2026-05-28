/**
 * Per-tenant runtime warm pool (ADR 0012 v1 — in-process LRU).
 * Caches resolved pack + last-touch for eviction; api-server holds Business rows.
 */

export type TenantRuntimeSlot<T> = {
  businessId: string;
  value: T;
  lastAccessAt: number;
};

export type TenantRuntimePoolOptions = {
  maxSlots?: number;
  idleTtlMs?: number;
};

const DEFAULT_MAX = 64;
const DEFAULT_TTL_MS = 15 * 60_000;

export class TenantRuntimePool<T> {
  private slots = new Map<string, TenantRuntimeSlot<T>>();
  private readonly maxSlots: number;
  private readonly idleTtlMs: number;

  constructor(opts?: TenantRuntimePoolOptions) {
    this.maxSlots = opts?.maxSlots ?? DEFAULT_MAX;
    this.idleTtlMs = opts?.idleTtlMs ?? DEFAULT_TTL_MS;
  }

  get(businessId: string): T | undefined {
    const slot = this.slots.get(businessId);
    if (!slot) return undefined;
    if (Date.now() - slot.lastAccessAt > this.idleTtlMs) {
      this.slots.delete(businessId);
      return undefined;
    }
    slot.lastAccessAt = Date.now();
    return slot.value;
  }

  set(businessId: string, value: T): void {
    this.evictIfNeeded();
    this.slots.set(businessId, {
      businessId,
      value,
      lastAccessAt: Date.now(),
    });
  }

  touch(businessId: string): void {
    const slot = this.slots.get(businessId);
    if (slot) slot.lastAccessAt = Date.now();
  }

  delete(businessId: string): void {
    this.slots.delete(businessId);
  }

  size(): number {
    return this.slots.size;
  }

  private evictIfNeeded(): void {
    const now = Date.now();
    for (const [id, slot] of this.slots) {
      if (now - slot.lastAccessAt > this.idleTtlMs) this.slots.delete(id);
    }
    while (this.slots.size >= this.maxSlots) {
      let oldestId: string | null = null;
      let oldest = Infinity;
      for (const [id, slot] of this.slots) {
        if (slot.lastAccessAt < oldest) {
          oldest = slot.lastAccessAt;
          oldestId = id;
        }
      }
      if (!oldestId) break;
      this.slots.delete(oldestId);
    }
  }
}
