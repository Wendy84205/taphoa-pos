import "./scripts/load-env.js";
import type { ExpoConfig } from "expo/config";

const rawBundleId = "space.manus.taphoa.pos.t20260814120419";
const bundleId = rawBundleId.replace(/[-_]/g, ".").replace(/[^a-zA-Z0-9.]/g, "").replace(/\.+/g, ".").replace(/^\.+|\.+$/g, "").toLowerCase() || "space.manus.taphoa.pos";
const timestamp = bundleId.split(".").pop()?.replace(/^t/, "") ?? "";

const env = {
  appName: "Tạp Hóa POS",
  appSlug: "taphoa-pos",
  logoUrl: "/manus-storage/icon_c74cf911.png",
  scheme: `manus${timestamp}`,
  iosBundleId: bundleId,
  androidPackage: bundleId,
};

const config: ExpoConfig = {
  name: env.appName,
  slug: env.appSlug,
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: env.scheme,
  userInterfaceStyle: "light",
  newArchEnabled: true,
  ios: { supportsTablet: true, bundleIdentifier: env.iosBundleId, buildNumber: "1", infoPlist: { ITSAppUsesNonExemptEncryption: false, NSAppTransportSecurity: { NSAllowsLocalNetworking: true } } },
  android: { adaptiveIcon: { backgroundColor: "#F7F7F2", foregroundImage: "./assets/images/android-icon-foreground.png", backgroundImage: "./assets/images/android-icon-background.png", monochromeImage: "./assets/images/android-icon-monochrome.png" }, edgeToEdgeEnabled: true, predictiveBackGestureEnabled: false, package: env.androidPackage, versionCode: 1, permissions: ["POST_NOTIFICATIONS"], intentFilters: [{ action: "VIEW", data: [{ scheme: env.scheme, host: "oauth", pathPrefix: "/callback" }], category: ["BROWSABLE", "DEFAULT"] }] },
  web: { bundler: "metro", output: "static", favicon: "./assets/images/favicon.png" },
  plugins: [
    "expo-router",
    "expo-asset",
    "expo-font",
    "expo-web-browser",
    "./plugins/with-lan-cleartext",
    "expo-document-picker",
    ["expo-camera", { cameraPermission: "Cho phép $(PRODUCT_NAME) dùng camera để quét mã vạch sản phẩm." }],
    ["expo-image-picker", { photosPermission: "Cho phép $(PRODUCT_NAME) truy cập ảnh để gắn ảnh sản phẩm.", cameraPermission: "Cho phép $(PRODUCT_NAME) dùng camera để chụp ảnh sản phẩm." }],
    ["expo-splash-screen", { image: "./assets/images/splash-icon.png", imageWidth: 200, resizeMode: "contain", backgroundColor: "#F7F7F2", dark: { backgroundColor: "#131A15" } }],
    ["expo-build-properties", { android: { buildArchs: ["armeabi-v7a", "arm64-v8a"], minSdkVersion: 24, compileSdkVersion: 36, targetSdkVersion: 36 } }],
  ],
  experiments: { typedRoutes: true, reactCompiler: true },
};

export default config;
