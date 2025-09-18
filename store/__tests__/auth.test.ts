import { act } from '@testing-library/react-native';
import { supabase } from '../../lib/supabase/client';

// Mock Supabase client
jest.mock('../../lib/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
      signUp: jest.fn(),
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
      onAuthStateChange: jest.fn(() => ({
        data: { subscription: { unsubscribe: jest.fn() } },
      })),
    },
    from: jest.fn(),
  },
}));

const mockSupabase = supabase as jest.Mocked<typeof supabase>;

// Import the store after mocking dependencies
const { useAuthStore } = require('../auth');

describe('AuthStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset the store state before each test
    act(() => {
      useAuthStore.setState({
        user: null,
        profile: null,
        initialized: false,
        loading: false,
      });
    });
  });

  describe('initialize', () => {
    it('should initialize with existing session', async () => {
      const mockUser = { id: 'test-user-id', email: 'test@example.com' };
      const mockProfile = {
        id: 'test-user-id',
        name: 'Test User',
        health_concerns: ['asthma'],
        notification_enabled: true,
        notification_time: '08:00',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      (mockSupabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: {
          session: { user: mockUser },
        },
        error: null,
      });

      (mockSupabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockProfile,
          error: null,
        }),
      });

      const store = useAuthStore.getState();
      await store.initialize();

      expect(store.user).toEqual(mockUser);
      expect(store.profile).toEqual(mockProfile);
      expect(store.initialized).toBe(true);
      expect(store.loading).toBe(false);
    });

    it('should initialize without session', async () => {
      (mockSupabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: null },
        error: null,
      });

      const store = useAuthStore.getState();
      await store.initialize();

      expect(store.user).toBeNull();
      expect(store.profile).toBeNull();
      expect(store.initialized).toBe(true);
      expect(store.loading).toBe(false);
    });
  });

  describe('signUp', () => {
    it('should sign up user successfully', async () => {
      const mockUser = { id: 'new-user-id', email: 'new@example.com' };
      const mockProfile = {
        id: 'new-user-id',
        name: 'New User',
        health_concerns: [],
        notification_enabled: false,
        notification_time: '09:00',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      (mockSupabase.auth.signUp as jest.Mock).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      (mockSupabase.from as jest.Mock).mockReturnValue({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockProfile,
          error: null,
        }),
      });

      const store = useAuthStore.getState();
      await store.signUp('new@example.com', 'password', 'New User');

      expect(store.user).toEqual(mockUser);
      expect(store.profile).toEqual(mockProfile);
    });

    it('should handle sign up error', async () => {
      const error = new Error('Sign up failed');

      (mockSupabase.auth.signUp as jest.Mock).mockResolvedValue({
        data: null,
        error,
      });

      const store = useAuthStore.getState();
      
      await expect(
        store.signUp('test@example.com', 'password', 'Test User')
      ).rejects.toThrow('Sign up failed');
    });
  });

  describe('signIn', () => {
    it('should sign in user successfully', async () => {
      const mockUser = { id: 'test-user-id', email: 'test@example.com' };
      const mockProfile = {
        id: 'test-user-id',
        name: 'Test User',
        health_concerns: ['asthma'],
        notification_enabled: true,
        notification_time: '08:00',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      (mockSupabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      (mockSupabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockProfile,
          error: null,
        }),
      });

      const store = useAuthStore.getState();
      await store.signIn('test@example.com', 'password');

      expect(store.user).toEqual(mockUser);
      expect(store.profile).toEqual(mockProfile);
    });
  });

  describe('signOut', () => {
    it('should sign out user successfully', async () => {
      (mockSupabase.auth.signOut as jest.Mock).mockResolvedValue({
        error: null,
      });

      // Set initial state with user
      useAuthStore.setState({
        user: { id: 'test-user-id', email: 'test@example.com' } as any,
        profile: { id: 'test-user-id', name: 'Test User' } as any,
      });

      const store = useAuthStore.getState();
      await store.signOut();

      expect(store.user).toBeNull();
      expect(store.profile).toBeNull();
    });
  });

  describe('updateProfile', () => {
    it('should update user profile successfully', async () => {
      const updatedProfile = {
        id: 'test-user-id',
        name: 'Updated User',
        health_concerns: ['asthma', 'allergies'],
        notification_enabled: true,
        notification_time: '09:00',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
      };

      (mockSupabase.from as jest.Mock).mockReturnValue({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: updatedProfile,
          error: null,
        }),
      });

      // Set initial state with user
      useAuthStore.setState({
        user: { id: 'test-user-id', email: 'test@example.com' } as any,
      });

      const store = useAuthStore.getState();
      await store.updateProfile({ name: 'Updated User', health_concerns: ['asthma', 'allergies'] });

      expect(store.profile).toEqual(updatedProfile);
    });

    it('should throw error when no user is authenticated', async () => {
      const store = useAuthStore.getState();
      
      await expect(
        store.updateProfile({ name: 'Test' })
      ).rejects.toThrow('No authenticated user');
    });
  });
});