const { withAndroidManifest } = require("@expo/config-plugins");

/** Cho phép ứng dụng gọi máy chủ HTTP trong Wi‑Fi nội bộ của quán. */
module.exports = function withLanCleartext(config) {
  return withAndroidManifest(config, (androidConfig) => {
    const application = androidConfig.modResults.manifest.application?.[0];
    if (application) application.$["android:usesCleartextTraffic"] = "true";
    return androidConfig;
  });
};
