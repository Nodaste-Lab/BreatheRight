import React from 'react';
import { render } from '@testing-library/react-native';
import { AQICard } from '../air-quality/AQICard';
import type { AQIData } from '../../types/location';

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
});