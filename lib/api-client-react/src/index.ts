export * from "./generated/api";
export * from "./generated/api.schemas";
export {
  setBaseUrl,
  setAuthTokenGetter,
  setRequestQueryParamGetter,
} from "./custom-fetch";
export type { AuthTokenGetter } from "./custom-fetch";
