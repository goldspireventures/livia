/** @type {import('expo/config').ExpoConfig} */
const appJson = require("./app.json");

const expo = appJson.expo;
const fastDev = process.env.LIVIA_DEV_FAST_BUNDLE === "1";

module.exports = {
  expo: {
    ...expo,
    experiments: {
      ...expo.experiments,
      // React Compiler adds minutes to first Windows bundle — off for device dev.
      reactCompiler: fastDev ? false : expo.experiments?.reactCompiler,
    },
  },
};
