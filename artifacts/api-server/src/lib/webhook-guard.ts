/**
 * Webhook signature verification must fail closed in production.
 */
export function requireWebhookSecretInProduction(envName: string): boolean {
  if (process.env.NODE_ENV !== "production") return true;
  const value = process.env[envName]?.trim();
  return Boolean(value);
}

export function twilioSignatureRequired(): boolean {
  if (process.env.NODE_ENV !== "production") {
    return process.env.TWILIO_SKIP_SIGNATURE_VALIDATION !== "true";
  }
  if (process.env.TWILIO_SKIP_SIGNATURE_VALIDATION === "true") return false;
  return Boolean(process.env.TWILIO_AUTH_TOKEN?.trim());
}
