const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);
const isWin = process.platform === "win32";

// Sibling artifacts (e.g. livia-internal Vite) can drop temp dirs while Metro watches the monorepo.
config.resolver.blockList = [
  /[\\/]artifacts[\\/]livia-internal[\\/].*/,
  /[\\/]\.vite[\\/].*/,
  // pnpm can leave ephemeral multer_* dirs under api-server deps; Metro must not watch them.
  /[\\/]node_modules[\\/]\.pnpm[\\/][^\\/]+[\\/]node_modules[\\/]multer_tmp_[^\\/]+[\\/].*/,
];

// Windows: monorepo watcher health-check times out and leaves Metro in a broken state (bundle 500).
if (isWin) {
  config.watcher = {
    ...config.watcher,
    healthCheck: {
      enabled: false,
    },
  };
  config.maxWorkers = 2;
}

module.exports = config;
