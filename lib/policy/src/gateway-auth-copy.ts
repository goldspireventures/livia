/** Gateway sign-up / sign-in copy — web + mobile. Plain product voice. */

export const GATEWAY_SIGN_IN_SUBTITLE = "Welcome back — your day is already in motion.";

export const GATEWAY_SIGN_UP_SUBTITLE =
  "Register with your work email. We’ll send a verification code to confirm it.";

export const GATEWAY_EMAIL_VERIFY_SUBTITLE =
  "Check your inbox and spam folder for the 6-digit code we just sent — same email flow as app.livia-hq.com on web.";

export const GATEWAY_EMAIL_VERIFY_RESEND = "Didn't get it? Resend code";

export const GATEWAY_SIGN_IN_DEVICE_VERIFY_SUBTITLE =
  "New device — we emailed a 6-digit code to confirm it's you. This is Clerk's sign-in protection, not an authenticator app you set up.";

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
    case "captcha_invalid":
    case "captcha_not_ready":
    case "captcha_missing_token":
      return "Security check did not complete. Try again, or register at app.livia-hq.com on the web.";
    case "second_factor_required":
    case "needs_second_factor":
    case "needs_client_trust":
      return "Check your email for a 6-digit code (new device check). Enter it on the next screen.";
    default: {
      const fb = fallback?.trim() || "";
      if (/second.?factor|two.?step|authenticator|client.?trust|verification.?required/i.test(fb)) {
        return "Check your email for a 6-digit sign-in code (new device check). Enter it on the next screen.";
      }
      return fb || "Could not complete sign-in. Try again.";
    }
  }
}
