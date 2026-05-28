import { AsyncLocalStorage } from "node:async_hooks";
import type { TenantContext, TenantContextProvider } from "./index";

const storage = new AsyncLocalStorage<TenantContext>();

export const tenantContextStore: TenantContextProvider = {
  current(): TenantContext | undefined {
    return storage.getStore();
  },
  run<T>(ctx: TenantContext, fn: () => T | Promise<T>): T | Promise<T> {
    return storage.run(ctx, fn);
  },
};
