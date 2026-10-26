const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const { withNativeWind } = require('nativewind/metro');

const defaultConfig = getDefaultConfig(__dirname);

/**
 * High-performance Metro configuration for Mommenttum Mobile
 * - Excludes heavy native build folders (android/app/build, .gradle, ios) from bundling
 * - Limits worker contention on Windows filesystem for fast AST transforms
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const customConfig = {
  resolver: {
    sourceExts: [...defaultConfig.resolver.sourceExts, 'mjs', 'cjs'],
    blockList: [
      /[\\\/]android[\\\/](app[\\\/])?build[\\\/]/,
      /[\\\/]ios[\\\/](build|Pods)[\\\/]/,
      /[\\\/]\.gradle[\\\/]/,
      /[\\\/]\.git[\\\/]/,
      defaultConfig.resolver.blockList,
    ],
  },
  maxWorkers: 2,
};

const config = mergeConfig(defaultConfig, customConfig);

module.exports = withNativeWind(config, { input: './global.css' });
