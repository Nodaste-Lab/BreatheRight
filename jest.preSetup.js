// This file runs before jest.setup.js and before any test files are loaded

// Set up Platform globally before any imports
global.Platform = {
  OS: 'ios',
  select: jest.fn((obj) => obj.ios || obj.default),
  isPad: false,
  isTesting: true,
  Version: 14,
};

// Mock React Native modules early
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  RN.Platform = global.Platform;
  RN.NativeModules = {
    ...RN.NativeModules,
    SettingsManager: {
      settings: {
        AppleLocale: 'en-US',
        AppleLanguages: ['en-US'],
      },
    },
  };
  return RN;
});