import { fetchCombinedAirQuality } from '../../lib/api/combined-air-quality';
import type { AQIData, CombinedAQIData } from '../../types/location';

// Mock Microsoft API module
jest.mock('../../lib/api/microsoft-weather');

import { fetchMicrosoftCurrentAirQuality } from '../../lib/api/microsoft-weather';

const mockFetchMicrosoftCurrentAirQuality = fetchMicrosoftCurrentAirQuality as jest.MockedFunction<typeof fetchMicrosoftCurrentAirQuality>;

describe('Combined Air Quality API', () => {
  const mockAQIData: AQIData = {
    aqi: 50,
    level: 'Good',
    pollutants: { pm25: 12, pm10: 20, o3: 85, no2: 15, so2: 8, co: 3 },
    timestamp: new Date().toISOString()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.EXPO_PUBLIC_AZURE_MAPS_API_KEY = 'test-key';
  });

  describe('Microsoft-Only Data Source', () => {
    it('returns Microsoft data when available', async () => {
      const microsoftData = { 
        ...mockAQIData, 
        aqi: 42,
        level: 'Good' as const,
        source: 'microsoft',
        dominantPollutant: 'PM2.5',
        description: 'Air quality is good',
        color: '#00e676'
      };
      
      mockFetchMicrosoftCurrentAirQuality.mockResolvedValue(microsoftData);

      const result = await fetchCombinedAirQuality(39.7392, -104.9903);

      expect(result.aqi).toBe(42);
      expect(result.level).toBe('Good');
      expect(result.sources.microsoft).toBe(true);
      expect(result.sources.google).toBe(false);
      expect(result.sources.openweather).toBe(false);
      expect(result.sources.waqi).toBe(false);
      expect(result.sources.purpleair).toBe(false);
      expect(result.sources.airnow).toBe(false);
      expect(result.confidence).toBe('high');
    });

    it('returns error state when Microsoft API fails', async () => {
      mockFetchMicrosoftCurrentAirQuality.mockRejectedValue(new Error('API Error'));

      const result = await fetchCombinedAirQuality(39.7392, -104.9903);

      expect(result.aqi).toBe(-1);
      expect(result.level).toBe('Unknown');
      expect(result.error).toBe('No air quality data available from any source');
      expect(result.sources.microsoft).toBe(false);
      expect(result.confidence).toBe('low');
    });

    it('preserves Microsoft metadata when available', async () => {
      const microsoftData = {
        ...mockAQIData,
        aqi: 75,
        level: 'Moderate' as const,
        source: 'microsoft',
        dominantPollutant: 'O3',
        description: 'Air quality is moderate',
        color: '#ffeb3b'
      };

      mockFetchMicrosoftCurrentAirQuality.mockResolvedValue(microsoftData);

      const result = await fetchCombinedAirQuality(39.7392, -104.9903);

      expect(result.metadata?.microsoft).toEqual({
        dominantPollutant: 'O3',
        description: 'Air quality is moderate',
        color: '#ffeb3b'
      });
    });

    it('handles partial pollutant data from Microsoft', async () => {
      const microsoftData = {
        ...mockAQIData,
        pollutants: { 
          pm25: 15, 
          pm10: 25, 
          o3: -1, // Missing data
          no2: 20, 
          so2: -1, // Missing data
          co: 5 
        }
      };

      mockFetchMicrosoftCurrentAirQuality.mockResolvedValue(microsoftData);

      const result = await fetchCombinedAirQuality(39.7392, -104.9903);

      expect(result.pollutants.pm25).toBe(15);
      expect(result.pollutants.pm10).toBe(25);
      expect(result.pollutants.o3).toBe(-1);
      expect(result.pollutants.no2).toBe(20);
      expect(result.pollutants.so2).toBe(-1);
      expect(result.pollutants.co).toBe(5);
    });

    it('handles API key not configured', async () => {
      delete process.env.EXPO_PUBLIC_AZURE_MAPS_API_KEY;

      const result = await fetchCombinedAirQuality(39.7392, -104.9903);

      expect(result.aqi).toBe(-1);
      expect(result.level).toBe('Unknown');
      expect(result.error).toBe('No air quality data available from any source');
      expect(result.confidence).toBe('low');
    });

    it('validates coordinates before making API call', async () => {
      const invalidCoordinates = [
        { lat: 91, lon: 0 },     // Invalid latitude
        { lat: -91, lon: 0 },    // Invalid latitude
        { lat: 0, lon: 181 },    // Invalid longitude
        { lat: 0, lon: -181 },   // Invalid longitude
        { lat: NaN, lon: 0 },    // NaN latitude
        { lat: 0, lon: NaN },    // NaN longitude
      ];

      for (const coords of invalidCoordinates) {
        const result = await fetchCombinedAirQuality(coords.lat, coords.lon);
        expect(result.aqi).toBe(-1);
        expect(result.level).toBe('Unknown');
        expect(result.error).toBe('No air quality data available from any source');
      }

      expect(mockFetchMicrosoftCurrentAirQuality).not.toHaveBeenCalled();
    });

    it('includes timestamp from Microsoft data', async () => {
      const timestamp = '2025-09-02T12:00:00Z';
      const microsoftData = {
        ...mockAQIData,
        timestamp
      };

      mockFetchMicrosoftCurrentAirQuality.mockResolvedValue(microsoftData);

      const result = await fetchCombinedAirQuality(39.7392, -104.9903);

      expect(result.timestamp).toBe(timestamp);
    });

    it('calculates average pollutants when Microsoft provides data', async () => {
      const microsoftData = {
        ...mockAQIData,
        pollutants: {
          pm25: 10,
          pm10: 20,
          o3: 30,
          no2: 40,
          so2: 50,
          co: 60
        }
      };

      mockFetchMicrosoftCurrentAirQuality.mockResolvedValue(microsoftData);

      const result = await fetchCombinedAirQuality(39.7392, -104.9903);

      expect(result.pollutants).toEqual({
        pm25: 10,
        pm10: 20,
        o3: 30,
        no2: 40,
        so2: 50,
        co: 60
      });
    });
  });
});