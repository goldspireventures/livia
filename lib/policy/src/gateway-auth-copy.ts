/** Gateway sign-up / sign-in copy — web + mobile. Plain product voice. */

export const GATEWAY_PASSWORD_HINT =
  "At least 8 characters. Three unrelated words usually works (e.g. cedar-plover-mist).";

export function humanizeGatewayAuthError(
  code: string | undefined,
  fallback: string | undefined,
): string {
  if (!code) return fallback?.trim() || "Something went wrong. Try again.";
  switch (code) {
    case "form_identifier_not_found":
      return "No account for that email. Check the spelling or create an account.";
    case "form_password_incorrect":
      return "Wrong password for that email.";
    case "form_password_pwned":
      return "That password has appeared in a data breach. Pick a different one — three random words is fine.";
    case "form_password_length_too_short":
      return "Use at least 8 characters.";
    case "form_password_validation_failed":
      return "Password did not meet the requirements. Use at least 8 characters.";
    case "form_identifier_exists":
      return "That email already has an account. Sign in instead.";
    case "form_code_incorrect":
      return "Wrong code. Check your email and try again.";
    case "verification_expired":
      return "That code expired. Resend and try again.";
    case "session_exists":
      return "You are already signed in.";
    default:
      return fallback?.trim() || "Could not complete sign-in. Try again.";
  }
}
