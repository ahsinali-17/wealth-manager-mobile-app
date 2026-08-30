const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

config.resolver.unstable_enablePackageExports = true;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName.endsWith("provider/singleton")) {
    return context.resolveRequest(context, moduleName + "/index.js", platform);
  }
  if (
    context.originModulePath &&
    context.originModulePath.includes("node_modules") &&
    context.originModulePath.includes("zod")
  ) {
    return context.resolveRequest(
      { ...context, unstable_enablePackageExports: false },
      moduleName,
      platform,
    );
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = withNativeWind(config, { input: "./global.css" });
