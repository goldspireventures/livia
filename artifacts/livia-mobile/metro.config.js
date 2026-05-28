const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Sibling artifacts (e.g. livia-internal Vite) can drop temp dirs while Metro watches the monorepo.
config.resolver.blockList = [
  /[\\/]artifacts[\\/]livia-internal[\\/].*/,
  /[\\/]\.vite[\\/].*/,
  // pnpm can leave ephemeral multer_* dirs under api-server deps; Metro must not watch them.
  /[\\/]node_modules[\\/]\.pnpm[\\/][^\\/]+[\\/]node_modules[\\/]multer_tmp_[^\\/]+[\\/].*/,
];

module.exports = config;
