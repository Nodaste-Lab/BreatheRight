import 'react-native-gesture-handler/jestSetup';

// Mock expo modules
jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
  reverseGeocodeAsync: jest.fn(),
  Accuracy: {
    High: 'high',
  },
}));

jest.mock('expo-router', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  })),
  Stack: {
    Screen: jest.fn(),
  },
  Tabs: {
    Screen: jest.fn(),
  },
}));

// Mock Supabase
jest.mock('./lib/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: jest.fn(),
      signUp: jest.fn(),
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
      resetPasswordForEmail: jest.fn(),
      updateUser: jest.fn(),
      onAuthStateChange: jest.fn(),
      getSession: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      single: jest.fn(),
    })),
  },
}));

// Mock React Native Alert specifically
jest.mock('react-native/Libraries/Alert/Alert', () => ({
  alert: jest.fn(),
}));

// Mock Platform
jest.mock('react-native/Libraries/Utilities/Platform', () => ({
  OS: 'ios',
  select: jest.fn((obj) => obj.ios),
  isPad: false,
  isTesting: true,
  Version: 14,
}));

// Ensure Platform is available globally for React Native Testing Library
const PlatformMock = {
  OS: 'ios',
  select: jest.fn((obj) => obj.ios),
  isPad: false,
  isTesting: true,
  Version: 14,
};

global.Platform = PlatformMock;

// Make sure require('react-native').Platform returns the same mock
jest.doMock('react-native', () => ({
  Platform: PlatformMock,
  StyleSheet: {
    create: jest.fn((styles) => styles),
  },
  Alert: { alert: jest.fn() },
  View: 'View',
  Text: 'Text',
  ScrollView: 'ScrollView',
  TouchableOpacity: 'TouchableOpacity',
}));

// Mock Expo Vector Icons
jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
  MaterialIcons: 'MaterialIcons',
  AntDesign: 'AntDesign',
}));

// Mock Google Fonts
jest.mock('@expo-google-fonts/nunito-sans', () => ({
  useFonts: jest.fn(() => [true, null]),
  NunitoSans_400Regular: 'NunitoSans_400Regular',
  NunitoSans_600SemiBold: 'NunitoSans_600SemiBold',
  NunitoSans_700Bold: 'NunitoSans_700Bold',
  NunitoSans_800ExtraBold: 'NunitoSans_800ExtraBold',
}));

jest.mock('@expo-google-fonts/baloo-2', () => ({
  useFonts: jest.fn(() => [true, null]),
  Baloo2_400Regular: 'Baloo2_400Regular',
  Baloo2_500Medium: 'Baloo2_500Medium',
  Baloo2_600SemiBold: 'Baloo2_600SemiBold',
  Baloo2_700Bold: 'Baloo2_700Bold',
  Baloo2_800ExtraBold: 'Baloo2_800ExtraBold',
}));

// Mock fetch for geocoding
global.fetch = jest.fn();

// Set environment variables for tests
process.env.EXPO_PUBLIC_AIRNOW_API_KEY = 'test-api-key';

// Mock Zustand
jest.mock('zustand', () => ({
  create: jest.fn((fn) => {
    const mockState = {};
    return jest.fn(() => {
      if (typeof fn === 'function') {
        const stateAndActions = fn(
          (updater) => {
            if (typeof updater === 'function') {
              Object.assign(mockState, updater(mockState));
            } else {
              Object.assign(mockState, updater);
            }
          },
          () => mockState
        );
        Object.assign(mockState, stateAndActions);
        return mockState;
      }
      return mockState;
    });
  }),
}));

// Mock console methods for cleaner test output
const originalWarn = console.warn;
const originalError = console.error;

beforeAll(() => {
  console.warn = jest.fn();
  console.error = jest.fn();
});

afterAll(() => {
  console.warn = originalWarn;
  console.error = originalError;
});