import { useAuthStore } from '../auth';
import { supabase } from '../../lib/supabase/client';

jest.mock('zustand');

const mockSupabase = supabase as jest.Mocked<typeof supabase>;

describe('AuthStore', () => {
  let store: any;

  beforeEach(() => {
    jest.clearAllMocks();
    store = useAuthStore.getState();
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

      mockSupabase.auth.getSession.mockResolvedValue({
        data: {
          session: { user: mockUser },
        },
        error: null,
      } as any);

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockProfile,
          error: null,
        }),
      } as any);

      await store.initialize();

      expect(store.user).toEqual(mockUser);
      expect(store.profile).toEqual(mockProfile);
      expect(store.initialized).toBe(true);
      expect(store.loading).toBe(false);
    });

    it('should initialize without session', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null,
      } as any);

      await store.initialize();

      expect(store.user).toBe(null);
      expect(store.profile).toBe(null);
      expect(store.initialized).toBe(true);
      expect(store.loading).toBe(false);
    });
  });

  describe('signUp', () => {
    it('should sign up user successfully', async () => {
      const mockUser = { id: 'new-user-id', email: 'new@example.com' };
      const mockSession = { user: mockUser, access_token: 'token' };

      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      } as any);

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      } as any);

      await store.signUp('new@example.com', 'password123', 'New User');

      expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
        email: 'new@example.com',
        password: 'password123',
        options: { data: { name: 'New User' } },
      });
      expect(store.user).toEqual(mockUser);
      expect(store.loading).toBe(false);
    });

    it('should handle sign up error', async () => {
      const signUpError = new Error('Email already exists');

      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: null, session: null },
        error: signUpError,
      } as any);

      await expect(store.signUp('test@example.com', 'password', 'Test User')).rejects.toThrow('Email already exists');
      expect(store.loading).toBe(false);
    });
  });

  describe('signIn', () => {
    it('should sign in user successfully', async () => {
      const mockUser = { id: 'user-id', email: 'test@example.com' };
      const mockProfile = {
        id: 'user-id',
        name: 'Test User',
        health_concerns: [],
        notification_enabled: true,
        notification_time: '08:00',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: mockUser, session: { user: mockUser } },
        error: null,
      } as any);

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockProfile,
          error: null,
        }),
      } as any);

      await store.signIn('test@example.com', 'password123');

      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
      expect(store.user).toEqual(mockUser);
      expect(store.profile).toEqual(mockProfile);
    });
  });

  describe('signOut', () => {
    it('should sign out user successfully', async () => {
      mockSupabase.auth.signOut.mockResolvedValue({
        error: null,
      } as any);

      await store.signOut();

      expect(mockSupabase.auth.signOut).toHaveBeenCalled();
      expect(store.user).toBe(null);
      expect(store.profile).toBe(null);
      expect(store.loading).toBe(false);
    });
  });

  describe('updateProfile', () => {
    it('should update user profile successfully', async () => {
      const mockUser = { id: 'user-id', email: 'test@example.com' };
      store.user = mockUser;

      const updatedProfile = {
        id: 'user-id',
        name: 'Updated Name',
        health_concerns: ['allergies'],
        notification_enabled: false,
        notification_time: '09:00',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
      };

      mockSupabase.from.mockReturnValue({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: updatedProfile,
          error: null,
        }),
      } as any);

      await store.updateProfile({ name: 'Updated Name', health_concerns: ['allergies'] });

      expect(store.profile).toEqual(updatedProfile);
      expect(store.loading).toBe(false);
    });

    it('should throw error when no user is authenticated', async () => {
      store.user = null;

      await expect(store.updateProfile({ name: 'Test' })).rejects.toThrow('No authenticated user');
    });
  });
});