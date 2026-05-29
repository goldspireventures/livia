import { getMarketingOrigin } from "@/lib/public-booking-url";

const legalBase = () => `${getMarketingOrigin()}/legal`;

export const privacyPolicyUrl = () => `${legalBase()}/privacy`;
export const termsOfServiceUrl = () => `${legalBase()}/tos`;
export const dpaUrl = () => `${legalBase()}/dpa`;
