const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

// Define project and workspace roots
const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '..');

const config = getDefaultConfig(projectRoot);

// 1. Watch the entire monorepo
config.watchFolders = [workspaceRoot];

// 2. Ensure Metro can resolve modules from both mobile and root
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// 3. Add shared folder to resolver
config.resolver.extraNodeModules = {
  '@shared': path.resolve(workspaceRoot, 'shared'),
};

// 4. Ensure source extensions are properly configured
config.resolver.sourceExts = [...config.resolver.sourceExts, 'cjs'];

module.exports = withNativeWind(config, { input: './global.css' });