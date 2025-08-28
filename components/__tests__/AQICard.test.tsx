import React from 'react';
import { render } from '@testing-library/react-native';
import { AQICard } from '../air-quality/AQICard';
import type { AQIData } from '../../types/location';
import type { CombinedAQIData } from '../../lib/api/combined-air-quality';

describe('AQICard', () => {
  const mockAQIData: AQIData = {
    aqi: 42,
    level: 'Good',
    pollutants: {
      pm25: 12,
      pm10: 20,
      o3: 85,
      no2: 15,
      so2: 8,
      co: 3,
    },
    timestamp: '2024-01-01T12:00:00Z',
  };

  const mockCombinedAQIData: CombinedAQIData = {
    ...mockAQIData,
    sources: {
      google: true,
      openweather: true,
      waqi: true,
      purpleair: false,
      airnow: true
    },
    confidence: 'high' as const,
    discrepancy: {
      detected: false,
      maxDifference: 5,
      strategy: 'average' as const,
      details: 'Good agreement across sources'
    },
    rawData: {
      google: mockAQIData,
      openweather: mockAQIData,
      waqi: mockAQIData,
      airnow: mockAQIData
    }
  };

  it('renders AQI information correctly', () => {
    const { getByText } = render(<AQICard data={mockAQIData} />);

    expect(getByText('Air Quality Index')).toBeTruthy();
    expect(getByText('42')).toBeTruthy();
    expect(getByText('Good')).toBeTruthy();
    expect(getByText('AQI Level')).toBeTruthy();
    expect(getByText('Pollutant Breakdown')).toBeTruthy();
  });

  it('displays pollutant values correctly', () => {
    const { getByText } = render(<AQICard data={mockAQIData} />);

    expect(getByText('PM2.5')).toBeTruthy();
    expect(getByText('12 µg/m³')).toBeTruthy();
    expect(getByText('PM10')).toBeTruthy();
    expect(getByText('20 µg/m³')).toBeTruthy();
    expect(getByText('Ozone')).toBeTruthy();
    expect(getByText('85 µg/m³')).toBeTruthy();
    expect(getByText('NO2')).toBeTruthy();
    expect(getByText('15 µg/m³')).toBeTruthy();
  });

  it('formats timestamp correctly', () => {
    const { getByText } = render(<AQICard data={mockAQIData} />);

    // Should show "Updated 12:00 PM" (or similar based on locale)
    expect(getByText(/Updated \d{1,2}:\d{2}/)).toBeTruthy();
  });

  it('renders correct colors for different AQI levels', () => {
    const goodAQI = { ...mockAQIData, aqi: 25, level: 'Good' as const };
    const moderateAQI = { ...mockAQIData, aqi: 75, level: 'Moderate' as const };
    const unhealthyAQI = { ...mockAQIData, aqi: 125, level: 'Unhealthy for Sensitive Groups' as const };

    const { rerender, getByText } = render(<AQICard data={goodAQI} />);
    let aqiCircle = getByText('25').parent;
    expect(aqiCircle).toHaveStyle({ backgroundColor: expect.any(String) });

    rerender(<AQICard data={moderateAQI} />);
    aqiCircle = getByText('75').parent;
    expect(aqiCircle).toHaveStyle({ backgroundColor: expect.any(String) });

    rerender(<AQICard data={unhealthyAQI} />);
    aqiCircle = getByText('125').parent;
    expect(aqiCircle).toHaveStyle({ backgroundColor: expect.any(String) });
  });

  it('renders all AQI levels correctly', () => {
    const testCases = [
      { aqi: 25, level: 'Good' as const },
      { aqi: 75, level: 'Moderate' as const },
      { aqi: 125, level: 'Unhealthy for Sensitive Groups' as const },
      { aqi: 175, level: 'Unhealthy' as const },
      { aqi: 250, level: 'Very Unhealthy' as const },
      { aqi: 350, level: 'Hazardous' as const },
    ];

    testCases.forEach(({ aqi, level }) => {
      const testData = { ...mockAQIData, aqi, level };
      const { getByText } = render(<AQICard data={testData} />);
      
      expect(getByText(aqi.toString())).toBeTruthy();
      expect(getByText(level)).toBeTruthy();
    });
  });

  describe('5-Source Combined Data', () => {
    it('displays source information for combined data', () => {
      const { getByText } = render(<AQICard data={mockCombinedAQIData} />);

      // Should show combined source text
      expect(getByText(/📊.*Google.*OpenWeather.*WAQI.*AirNow/)).toBeTruthy();
    });

    it('shows confidence indicator for high confidence', () => {
      const { getByText } = render(<AQICard data={mockCombinedAQIData} />);

      expect(getByText('Data confidence:')).toBeTruthy();
      expect(getByText('High (sources agree)')).toBeTruthy();
    });

    it('shows confidence indicator for medium confidence', () => {
      const mediumConfidenceData = {
        ...mockCombinedAQIData,
        confidence: 'medium' as const
      };
      
      const { getByText } = render(<AQICard data={mediumConfidenceData} />);
      expect(getByText('Medium (single source)')).toBeTruthy();
    });

    it('shows confidence indicator for conflicting data', () => {
      const conflictingData = {
        ...mockCombinedAQIData,
        confidence: 'conflicting' as const
      };
      
      const { getByText } = render(<AQICard data={conflictingData} />);
      expect(getByText('Low (sources conflict)')).toBeTruthy();
    });

    it('displays discrepancy warning when detected', () => {
      const discrepantData = {
        ...mockCombinedAQIData,
        discrepancy: {
          detected: true,
          maxDifference: 45,
          strategy: 'weighted_average' as const,
          details: 'Moderate variance detected'
        },
        rawData: {
          google: { ...mockAQIData, aqi: 40 },
          openweather: { ...mockAQIData, aqi: 45 },
          waqi: { ...mockAQIData, aqi: 85 }, // High variance
          airnow: { ...mockAQIData, aqi: 42 }
        }
      };

      const { getByText } = render(<AQICard data={discrepantData} />);

      expect(getByText(/⚠️.*Moderate variance detected/)).toBeTruthy();
      expect(getByText(/Google: 40.*OpenWeather: 45.*WAQI: 85.*AirNow: 42/)).toBeTruthy();
    });

    it('shows all 5 sources when available', () => {
      const allSourcesData = {
        ...mockCombinedAQIData,
        sources: {
          google: true,
          openweather: true,
          waqi: true,
          purpleair: true,
          airnow: true
        }
      };

      const { getByText } = render(<AQICard data={allSourcesData} />);
      expect(getByText(/📊.*Google.*OpenWeather.*WAQI.*PurpleAir.*AirNow/)).toBeTruthy();
    });

    it('handles missing sources gracefully', () => {
      const limitedSourcesData = {
        ...mockCombinedAQIData,
        sources: {
          google: false,
          openweather: false,
          waqi: true,
          purpleair: false,
          airnow: false
        }
      };

      const { getByText } = render(<AQICard data={limitedSourcesData} />);
      expect(getByText(/📊.*WAQI/)).toBeTruthy();
    });
  });
});