import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

const configDir = path.resolve(import.meta.dirname);

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, configDir, "");
  /** Dev/preview only — Vercel build does not need PORT (defaults like marketing). */
  const port = Number(env.PORT ?? process.env.PORT ?? 5173);
  if (Number.isNaN(port) || port <= 0) {
    throw new Error(`Invalid PORT value: "${env.PORT ?? process.env.PORT ?? ""}"`);
  }

  const basePath = env.BASE_PATH ?? process.env.BASE_PATH ?? "/";
  const apiProxy = env.VITE_API_PROXY ?? "http://127.0.0.1:3000";

  return {
  base: basePath,
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(configDir, "src"),
      "@assets": path.resolve(configDir, "..", "..", "attached_assets"),
    },
    dedupe: ["react", "react-dom"],
  },
  root: configDir,
  build: {
    outDir: path.resolve(configDir, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    port,
    strictPort: true,
    host: "0.0.0.0",
    allowedHosts: true,
    proxy: {
      "/api": {
        target: apiProxy,
        changeOrigin: true,
      },
    },
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
      Pragma: "no-cache",
    },
    fs: {
      strict: true,
    },
  },
  preview: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
  },
};
});
