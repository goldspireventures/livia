/**
 * Mobile error reporting hook — enable with EXPO_PUBLIC_SENTRY_DSN + @sentry/react-native.
 * Until the SDK is added, failures stay in ErrorBoundary + console.
 */
let initialized = false;

export function initMobileSentry(): void {
  if (initialized) return;
  const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;
  if (!dsn) {
    if (__DEV__) {
      console.info("[sentry] mobile disabled (EXPO_PUBLIC_SENTRY_DSN not set)");
    }
    return;
  }
  // When @sentry/react-native is installed, init here with release from expo-constants.
  if (__DEV__) {
    console.info("[sentry] DSN set — add @sentry/react-native to enable capture");
  }
  initialized = true;
}

export function captureMobileException(error: unknown): void {
  if (__DEV__) {
    console.error("[sentry] capture (no SDK)", error);
  }
}
