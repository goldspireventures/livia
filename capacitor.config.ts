import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Native shells load `webDir` when offline; for dev, point `server.url` at your Next dev server
 * (same LAN IP the phone can reach), then `npx cap run ios|android`.
 */
const serverUrl = process.env.CAPACITOR_SERVER_URL?.trim();

const config: CapacitorConfig = {
  appId: "com.bliq.app",
  appName: "Bliq",
  webDir: "capacitor-www",
  ...(serverUrl
    ? {
        server: {
          url: serverUrl,
          cleartext: serverUrl.startsWith("http://"),
        },
      }
    : {}),
};

export default config;
