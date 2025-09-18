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
jest.mock('./lib/supabase/client', () => {
  const mockChain = {
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: null, error: null }),
    upsert: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    gt: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    lt: jest.fn().mockReturnThis(),
    lte: jest.fn().mockReturnThis(),
    neq: jest.fn().mockReturnThis(),
    or: jest.fn().mockReturnThis(),
    filter: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis(),
  };

  return {
    supabase: {
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
        signUp: jest.fn().mockResolvedValue({ data: null, error: null }),
        signInWithPassword: jest.fn().mockResolvedValue({ data: null, error: null }),
        signOut: jest.fn().mockResolvedValue({ error: null }),
        resetPasswordForEmail: jest.fn().mockResolvedValue({ data: null, error: null }),
        updateUser: jest.fn().mockResolvedValue({ data: null, error: null }),
        onAuthStateChange: jest.fn(() => ({
          data: { subscription: { unsubscribe: jest.fn() } },
        })),
        getSession: jest.fn().mockResolvedValue({ data: { session: null }, error: null }),
      },
      from: jest.fn(() => mockChain),
    },
  };
});

// Mock React Native Alert
jest.mock('react-native/Libraries/Alert/Alert', () => ({
  alert: jest.fn(),
}));

// Mock Expo modules that might be missing
jest.mock('expo-blur', () => ({
  BlurView: 'BlurView',
}));

jest.mock('expo-linear-gradient', () => ({
  LinearGradient: 'LinearGradient',
}));

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: {
    Light: 'Light',
    Medium: 'Medium',
    Heavy: 'Heavy',
  },
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

// Mock NativeWind
jest.mock('nativewind', () => ({
  styled: (component) => component,
}));

// Mock Zustand
jest.mock('zustand', () => {
  const actualZustand = jest.requireActual('zustand');
  return {
    ...actualZustand,
    create: (createStore) => {
      const store = actualZustand.create(createStore);
      return Object.assign(store, {
        setState: store.setState,
        getState: store.getState,
        subscribe: store.subscribe,
        destroy: store.destroy,
      });
    },
  };
});

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