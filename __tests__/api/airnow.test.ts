import { fetchAirNowObservations, fetchAirNowForecast, fetchWildFireData } from '../../lib/api/airnow';
import type { AirNowObservation, AirNowForecast } from '../../lib/api/airnow';

// Mock fetch globally
global.fetch = jest.fn();

describe('AirNow API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchAirNowObservations', () => {
    const mockObservations: AirNowObservation[] = [
      {
        DateObserved: '2025-08-28',
        HourObserved: 14,
        LocalTimeZone: 'EST',
        ReportingArea: 'Denver',
        StateCode: 'CO',
        Latitude: 39.7392,
        Longitude: -104.9903,
        ParameterName: 'PM2.5',
        AQI: 42,
        Category: {
          Number: 1,
          Name: 'Good'
        }
      },
      {
        DateObserved: '2025-08-28',
        HourObserved: 14,
        LocalTimeZone: 'EST',
        ReportingArea: 'Denver',
        StateCode: 'CO',
        Latitude: 39.7392,
        Longitude: -104.9903,
        ParameterName: 'PM10',
        AQI: 35,
        Category: {
          Number: 1,
          Name: 'Good'
        }
      }
    ];

    it('fetches observations successfully', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockObservations
      });

      const result = await fetchAirNowObservations(39.7392, -104.9903);

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('airnowapi.org/aq/observation/latLong/current')
      );
      expect(result).toEqual(mockObservations);
    });

    it.skip('throws error when API key is missing', async () => {
      // Skipped due to module caching issues in Jest
      const originalKey = process.env.EXPO_PUBLIC_AIRNOW_API_KEY;
      delete process.env.EXPO_PUBLIC_AIRNOW_API_KEY;

      await expect(fetchAirNowObservations(39.7392, -104.9903))
        .rejects.toThrow('AirNow API key not configured');

      // Restore the key for other tests
      process.env.EXPO_PUBLIC_AIRNOW_API_KEY = originalKey;
    });

    it('throws error on API failure', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request'
      });

      await expect(fetchAirNowObservations(39.7392, -104.9903))
        .rejects.toThrow('AirNow API error: 400 Bad Request');
    });

    it('provides helpful error message for CORS issues', async () => {
      (fetch as jest.Mock).mockRejectedValueOnce(new TypeError('Failed to fetch'));

      await expect(fetchAirNowObservations(39.7392, -104.9903))
        .rejects.toThrow('AirNow API blocked by browser CORS policy. Please test on mobile device.');
    });
  });

  describe('fetchAirNowForecast', () => {
    const mockForecast: AirNowForecast[] = [
      {
        DateIssued: '2025-08-28',
        DateForecast: '2025-08-29',
        ReportingArea: 'Denver',
        StateCode: 'CO',
        Latitude: 39.7392,
        Longitude: -104.9903,
        ParameterName: 'PM2.5',
        AQI: 50,
        Category: {
          Number: 1,
          Name: 'Good'
        },
        ActionDay: false,
        Discussion: 'Air quality expected to remain good'
      }
    ];

    it('fetches forecast successfully', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockForecast
      });

      const result = await fetchAirNowForecast(39.7392, -104.9903);

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('airnowapi.org/aq/forecast/latLong')
      );
      expect(result).toEqual(mockForecast);
    });
  });

  describe('fetchWildFireData', () => {
    const mockObservations: AirNowObservation[] = [
      {
        DateObserved: '2025-08-28',
        HourObserved: 14,
        LocalTimeZone: 'EST',
        ReportingArea: 'Denver',
        StateCode: 'CO',
        Latitude: 39.7392,
        Longitude: -104.9903,
        ParameterName: 'PM2.5',
        AQI: 85,
        Category: {
          Number: 2,
          Name: 'Moderate'
        }
      },
      {
        DateObserved: '2025-08-28',
        HourObserved: 14,
        LocalTimeZone: 'EST',
        ReportingArea: 'Denver',
        StateCode: 'CO',
        Latitude: 39.7392,
        Longitude: -104.9903,
        ParameterName: 'PM10',
        AQI: 65,
        Category: {
          Number: 2,
          Name: 'Moderate'
        }
      }
    ];

    const mockForecast: AirNowForecast[] = [
      {
        DateIssued: '2025-08-28',
        DateForecast: '2025-08-29',
        ReportingArea: 'Denver',
        StateCode: 'CO',
        Latitude: 39.7392,
        Longitude: -104.9903,
        ParameterName: 'PM2.5',
        AQI: 75,
        Category: {
          Number: 2,
          Name: 'Moderate'
        },
        Discussion: 'Improving conditions expected'
      }
    ];

    it('converts AirNow data to wildfire format successfully', async () => {
      (fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockObservations
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockForecast
        });

      const result = await fetchWildFireData(39.7392, -104.9903);

      expect(result).toMatchObject({
        smokeRisk: {
          level: 'Moderate',
          pm25: 85,
          visibility: expect.any(Number)
        },
        dustRisk: {
          level: 'Moderate', 
          pm10: 65,
          visibility: expect.any(Number)
        },
        fireActivity: {
          nearbyFires: -1,
          closestFireDistance: -1,
          largestFireSize: -1
        },
        outlook: {
          next24Hours: 'Stable',
          confidence: 'Moderate',
          details: expect.stringContaining('Improving conditions expected')
        }
      });
    });

    it('calculates smoke risk levels correctly', async () => {
      const testCases = [
        { aqiCategory: 'Good', expectedLevel: 'Low' },
        { aqiCategory: 'Moderate', expectedLevel: 'Moderate' },
        { aqiCategory: 'Unhealthy for Sensitive Groups', expectedLevel: 'High' },
        { aqiCategory: 'Unhealthy', expectedLevel: 'Unhealthy' },
        { aqiCategory: 'Very Unhealthy', expectedLevel: 'Very Unhealthy' },
        { aqiCategory: 'Hazardous', expectedLevel: 'Hazardous' }
      ];

      for (const testCase of testCases) {
        const observations = [{
          ...mockObservations[0],
          Category: { Number: 1, Name: testCase.aqiCategory }
        }];

        (fetch as jest.Mock)
          .mockResolvedValueOnce({
            ok: true,
            json: async () => observations
          })
          .mockResolvedValueOnce({
            ok: true,
            json: async () => []
          });

        const result = await fetchWildFireData(39.7392, -104.9903);
        expect(result.smokeRisk.level).toBe(testCase.expectedLevel);
      }
    });

    it('calculates dust risk from PM10 levels', async () => {
      const testCases = [
        { pm10: 25, expectedLevel: 'Low' },
        { pm10: 75, expectedLevel: 'Moderate' },
        { pm10: 175, expectedLevel: 'High' }
      ];

      for (const testCase of testCases) {
        const observations = [{
          ...mockObservations[1],
          AQI: testCase.pm10
        }];

        (fetch as jest.Mock)
          .mockResolvedValueOnce({
            ok: true,
            json: async () => observations
          })
          .mockResolvedValueOnce({
            ok: true,
            json: async () => []
          });

        const result = await fetchWildFireData(39.7392, -104.9903);
        expect(result.dustRisk.level).toBe(testCase.expectedLevel);
      }
    });

    it('analyzes outlook trends correctly', async () => {
      // Test improving trend
      const improvingForecast = [{
        ...mockForecast[0],
        AQI: 65 // Lower than current 85
      }];

      (fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockObservations
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => improvingForecast
        });

      let result = await fetchWildFireData(39.7392, -104.9903);
      expect(result.outlook.next24Hours).toBe('Improving');

      // Test worsening trend
      const worseningForecast = [{
        ...mockForecast[0],
        AQI: 110 // Much higher than current 85
      }];

      (fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockObservations
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => worseningForecast
        });

      result = await fetchWildFireData(39.7392, -104.9903);
      expect(result.outlook.next24Hours).toBe('Worsening');
    });

    it('handles no data gracefully', async () => {
      (fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [] // No observations
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => []
        });

      await expect(fetchWildFireData(39.7392, -104.9903))
        .rejects.toThrow('No air quality data available for this location');
    });
  });
});