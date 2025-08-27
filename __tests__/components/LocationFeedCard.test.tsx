import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { LocationFeedCard } from '../../components/location/LocationFeedCard';
import type { LocationData } from '../../types/location';

describe('LocationFeedCard', () => {
  const mockLocationData: LocationData = {
    location: {
      id: 'test-id',
      user_id: 'user-123',
      name: 'Home',
      latitude: 37.7749,
      longitude: -122.4194,
      address: '123 Main St, San Francisco, CA 94105',
      show_in_home: true,
      notify_daily: true,
      created_at: new Date().toISOString(),
    },
    aqi: {
      aqi: 45,
      level: 'Good',
      pollutants: {
        pm25: 10,
        pm10: 20,
        o3: 30,
        no2: 15,
        so2: 5,
        co: 1,
      },
      timestamp: new Date().toISOString(),
    },
    pollen: {
      overall: 3,
      tree: 3,
      grass: 2,
      weed: 4,
      level: 'Low-Medium',
      timestamp: new Date().toISOString(),
    },
    lightning: {
      probability: 25,
      level: 'Low',
      timestamp: new Date().toISOString(),
    },
  };

  const mockOnPress = jest.fn();
  const mockOnRemove = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders location information correctly', () => {
    const { getByText } = render(
      <LocationFeedCard
        data={mockLocationData}
        onPress={mockOnPress}
        onRemove={mockOnRemove}
      />
    );

    expect(getByText('Home')).toBeTruthy();
    expect(getByText(/San Francisco, CA/)).toBeTruthy();
  });

  it('displays AQI score correctly', () => {
    const { getByText } = render(
      <LocationFeedCard
        data={mockLocationData}
        onPress={mockOnPress}
        onRemove={mockOnRemove}
      />
    );

    expect(getByText('45')).toBeTruthy();
    expect(getByText('Air')).toBeTruthy();
  });

  it('displays pollen score correctly', () => {
    const { getByText } = render(
      <LocationFeedCard
        data={mockLocationData}
        onPress={mockOnPress}
        onRemove={mockOnRemove}
      />
    );

    expect(getByText('30')).toBeTruthy(); // overall * 10
    expect(getByText('Pollen')).toBeTruthy();
  });

  it('displays lightning probability correctly', () => {
    const { getByText } = render(
      <LocationFeedCard
        data={mockLocationData}
        onPress={mockOnPress}
        onRemove={mockOnRemove}
      />
    );

    expect(getByText('25%')).toBeTruthy();
    expect(getByText('Storm')).toBeTruthy();
  });

  it('calls onPress when card is pressed', () => {
    const { getByTestId } = render(
      <LocationFeedCard
        data={mockLocationData}
        onPress={mockOnPress}
        onRemove={mockOnRemove}
      />
    );

    const card = getByTestId('location-card-touchable');
    fireEvent.press(card);
    expect(mockOnPress).toHaveBeenCalledTimes(1);
  });

  it('calls onRemove when remove button is pressed', () => {
    const { getByText } = render(
      <LocationFeedCard
        data={mockLocationData}
        onPress={mockOnPress}
        onRemove={mockOnRemove}
      />
    );

    const removeButton = getByText('Remove');
    fireEvent.press(removeButton);
    expect(mockOnRemove).toHaveBeenCalledTimes(1);
  });

  it('handles missing data gracefully', () => {
    const incompleteData: LocationData = {
      location: mockLocationData.location,
      aqi: null,
      pollen: null,
    };

    const { getAllByText } = render(
      <LocationFeedCard
        data={incompleteData}
        onPress={mockOnPress}
      />
    );

    const dashElements = getAllByText('--');
    expect(dashElements.length).toBeGreaterThan(0);
  });
});