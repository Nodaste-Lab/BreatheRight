import { act } from '@testing-library/react-native';
import { supabase } from '../../lib/supabase/client';
import * as ExpoLocation from 'expo-location';

// Mock dependencies before importing the store
jest.mock('../../lib/supabase/client');
jest.mock('expo-location');

const mockSupabase = supabase as jest.Mocked<typeof supabase>;
const mockExpoLocation = ExpoLocation as jest.Mocked<typeof ExpoLocation>;

// Import the store after mocking dependencies
const { useLocationStore } = require('../location');

describe('LocationStore', () => {
  let store: any;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Create a fresh store instance for each test
    act(() => {
      store = useLocationStore.getState();
    });
    
    // Mock successful auth responses
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'test-user-id' } },
      error: null,
    } as any);

    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: { id: 'test-user-id' },
        error: null,
      }),
      order: jest.fn().mockReturnThis(),
    } as any);
  });

  describe('fetchUserLocations', () => {
    it('should fetch user locations successfully', async () => {
      const mockLocations = [
        {
          id: 'loc1',
          user_id: 'test-user-id',
          name: 'Home',
          address: '123 Main St',
          latitude: 40.7128,
          longitude: -74.0060,
          show_in_home: true,
          notify_daily: true,
          created_at: '2024-01-01T00:00:00Z',
        },
        {
          id: 'loc2',
          user_id: 'test-user-id',
          name: 'Work',
          address: '456 Work Ave',
          latitude: 40.7589,
          longitude: -73.9851,
          show_in_home: false,
          notify_daily: true,
          created_at: '2024-01-02T00:00:00Z',
        },
      ];

      // Mock the chain of calls
      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: 'test-user-id' },
          error: null,
        }),
        order: jest.fn().mockReturnThis(),
      };

      // Mock the locations query
      mockSupabase.from.mockImplementation((table) => {
        if (table === 'profiles') {
          return mockChain as any;
        }
        if (table === 'locations') {
          return {
            ...mockChain,
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            order: jest.fn().mockResolvedValue({
              data: mockLocations,
              error: null,
            }),
          } as any;
        }
        return mockChain as any;
      });

      await store.fetchUserLocations();

      expect(mockSupabase.from).toHaveBeenCalledWith('profiles');
      expect(mockSupabase.from).toHaveBeenCalledWith('locations');
      expect(store.locations).toEqual(mockLocations);
      expect(store.loading).toBe(false);
      expect(store.error).toBe(null);
    });

    it('should handle fetch error', async () => {
      mockSupabase.from.mockImplementation(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockRejectedValue(new Error('Database error')),
      }) as any);

      await store.fetchUserLocations();

      expect(store.error).toBe('Database error');
      expect(store.loading).toBe(false);
    });
  });

  describe('createLocation', () => {
    it('should create a new location successfully', async () => {
      const newLocation = {
        id: 'new-loc',
        user_id: 'test-user-id',
        name: 'New Place',
        address: '789 New St',
        latitude: 40.7831,
        longitude: -73.9712,
        show_in_home: true,
        notify_daily: true,
        created_at: '2024-01-03T00:00:00Z',
      };

      // Mock profile lookup
      mockSupabase.from.mockImplementation((table) => {
        if (table === 'profiles') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { id: 'test-user-id' },
              error: null,
            }),
          } as any;
        }
        if (table === 'locations') {
          // First call for existing locations check
          if (!mockSupabase.from.mock.calls.find(call => call[0] === 'locations' && call.length > 1)) {
            return {
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockResolvedValue({
                data: [], // No existing locations
                error: null,
              }),
            } as any;
          }
          // Second call for insert
          return {
            insert: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: newLocation,
              error: null,
            }),
          } as any;
        }
        return {} as any;
      });

      // Mock fetchUserLocations
      store.fetchUserLocations = jest.fn().mockResolvedValue(undefined);

      const result = await store.createLocation('New Place', 40.7831, -73.9712, '789 New St');

      expect(result).toEqual(newLocation);
      expect(store.fetchUserLocations).toHaveBeenCalled();
    });
  });

  describe('getUserCurrentLocation', () => {
    it('should get current location with permission', async () => {
      const mockPosition = {
        coords: {
          latitude: 40.7128,
          longitude: -74.0060,
        },
      };

      const mockAddress = [
        {
          streetNumber: '123',
          street: 'Main St',
          city: 'New York',
          region: 'NY',
        },
      ];

      mockExpoLocation.requestForegroundPermissionsAsync.mockResolvedValue({
        status: 'granted',
      } as any);

      mockExpoLocation.getCurrentPositionAsync.mockResolvedValue(mockPosition as any);
      mockExpoLocation.reverseGeocodeAsync.mockResolvedValue(mockAddress as any);

      const result = await store.getUserCurrentLocation();

      expect(result).toEqual({
        latitude: 40.7128,
        longitude: -74.0060,
        address: '123 Main St, New York, NY',
      });
    });

    it('should throw error when permission denied', async () => {
      mockExpoLocation.requestForegroundPermissionsAsync.mockResolvedValue({
        status: 'denied',
      } as any);

      await expect(store.getUserCurrentLocation()).rejects.toThrow('Location permission not granted');
    });
  });

  describe('getCurrentLocationData', () => {
    it('should generate mock AQI and pollen data', async () => {
      const mockLocation = {
        id: 'loc1',
        user_id: 'test-user-id',
        name: 'Test Location',
        address: '123 Test St',
        latitude: 40.7128,
        longitude: -74.0060,
        show_in_home: true,
        notify_daily: true,
        created_at: '2024-01-01T00:00:00Z',
      };

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockLocation,
          error: null,
        }),
      } as any);

      await store.getCurrentLocationData('loc1');

      expect(store.currentLocation).toBeTruthy();
      expect(store.currentLocation?.location).toEqual(mockLocation);
      expect(store.currentLocation?.aqi).toBeTruthy();
      expect(store.currentLocation?.pollen).toBeTruthy();
      expect(store.currentLocation?.aqi?.aqi).toBeGreaterThan(0);
      expect(store.currentLocation?.pollen?.overall).toBeGreaterThan(0);
    });
  });
});