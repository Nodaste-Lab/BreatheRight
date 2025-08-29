const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

// Explicitly set the app root for expo-router
process.env.EXPO_ROUTER_APP_ROOT = 'app';

const config = getDefaultConfig(__dirname);

module.exports = withNativeWind(config, { input: './global.css' });