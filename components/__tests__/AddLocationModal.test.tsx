import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { AddLocationModal } from '../location/AddLocationModal';
import { useLocationStore } from '../../store/location';
import * as ExpoLocation from 'expo-location';

// Mock the store
jest.mock('../../store/location');
const mockUseLocationStore = useLocationStore as jest.MockedFunction<typeof useLocationStore>;

// Mock expo-location
const mockExpoLocation = ExpoLocation as jest.Mocked<typeof ExpoLocation>;

// Mock Alert is handled in jest.setup.js

// Mock fetch for geocoding
const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

describe('AddLocationModal', () => {
  const mockProps = {
    visible: true,
    onClose: jest.fn(),
    onLocationAdded: jest.fn(),
  };

  const mockStore = {
    createLocation: jest.fn(),
    getUserCurrentLocation: jest.fn(),
    loading: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseLocationStore.mockReturnValue(mockStore as any);
  });

  it('renders correctly when visible', () => {
    const { getByText, getByPlaceholderText } = render(
      <AddLocationModal {...mockProps} />
    );

    expect(getByText('Add Location')).toBeTruthy();
    expect(getByPlaceholderText('e.g., Home, Work, etc.')).toBeTruthy();
    expect(getByPlaceholderText('e.g., New York, NY or 123 Main St')).toBeTruthy();
    expect(getByText('Use Current Location')).toBeTruthy();
    expect(getByText('Add Location')).toBeTruthy();
    expect(getByText('Cancel')).toBeTruthy();
  });

  it('does not render when not visible', () => {
    const { queryByText } = render(
      <AddLocationModal {...mockProps} visible={false} />
    );

    expect(queryByText('Add Location')).toBeFalsy();
  });

  it('handles current location addition successfully', async () => {
    const mockLocationData = {
      latitude: 40.7128,
      longitude: -74.0060,
      address: '123 Main St, New York, NY',
    };

    mockStore.getUserCurrentLocation.mockResolvedValue(mockLocationData);
    mockStore.createLocation.mockResolvedValue({
      id: 'new-location',
      name: 'Current Location',
      ...mockLocationData,
    });

    const { getByText } = render(<AddLocationModal {...mockProps} />);

    fireEvent.press(getByText('Use Current Location'));

    await waitFor(() => {
      expect(mockStore.getUserCurrentLocation).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(mockStore.createLocation).toHaveBeenCalledWith(
        'Current Location',
        40.7128,
        -74.0060,
        '123 Main St, New York, NY'
      );
    });

    expect(Alert.alert).toHaveBeenCalledWith('Success', 'Location added successfully!');
    expect(mockProps.onLocationAdded).toHaveBeenCalled();
    expect(mockProps.onClose).toHaveBeenCalled();
  });

  it('handles current location error', async () => {
    mockStore.getUserCurrentLocation.mockRejectedValue(new Error('Location permission denied'));

    const { getByText } = render(<AddLocationModal {...mockProps} />);

    fireEvent.press(getByText('Use Current Location'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Location permission denied');
    });
  });

  it('handles address-based location addition successfully', async () => {
    const mockGeocodingResponse = [
      {
        lat: '40.7128',
        lon: '-74.0060',
        display_name: 'New York, NY, USA',
      },
    ];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockGeocodingResponse,
    } as Response);

    mockStore.createLocation.mockResolvedValue({
      id: 'new-location',
      name: 'New York, NY',
      latitude: 40.7128,
      longitude: -74.0060,
      address: 'New York, NY, USA',
    });

    const { getByPlaceholderText, getByText } = render(<AddLocationModal {...mockProps} />);

    const addressInput = getByPlaceholderText('e.g., New York, NY or 123 Main St');
    fireEvent.changeText(addressInput, 'New York, NY');

    fireEvent.press(getByText('Add Location'));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        'https://nominatim.openstreetmap.org/search?format=json&q=New%20York%2C%20NY&limit=1'
      );
    });

    await waitFor(() => {
      expect(mockStore.createLocation).toHaveBeenCalledWith(
        'New York, NY',
        40.7128,
        -74.0060,
        'New York, NY, USA'
      );
    });

    expect(Alert.alert).toHaveBeenCalledWith('Success', 'Location added successfully!');
  });

  it('handles geocoding failure', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    } as Response);

    const { getByPlaceholderText, getByText } = render(<AddLocationModal {...mockProps} />);

    const addressInput = getByPlaceholderText('e.g., New York, NY or 123 Main St');
    fireEvent.changeText(addressInput, 'Invalid Location');

    fireEvent.press(getByText('Add Location'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Error',
        'Could not find the specified location. Please try a different address.'
      );
    });
  });

  it('prevents adding empty address', async () => {
    const { getByText } = render(<AddLocationModal {...mockProps} />);

    // Try to add location without entering address
    fireEvent.press(getByText('Add Location'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Please enter an address or location name');
    });

    expect(mockStore.createLocation).not.toHaveBeenCalled();
  });

  it('calls onClose when Cancel is pressed', () => {
    const { getByText } = render(<AddLocationModal {...mockProps} />);

    fireEvent.press(getByText('Cancel'));

    expect(mockProps.onClose).toHaveBeenCalled();
  });

  it('uses custom name when provided', async () => {
    const mockLocationData = {
      latitude: 40.7128,
      longitude: -74.0060,
      address: '123 Main St, New York, NY',
    };

    mockStore.getUserCurrentLocation.mockResolvedValue(mockLocationData);
    mockStore.createLocation.mockResolvedValue({
      id: 'new-location',
      name: 'My Home',
      ...mockLocationData,
    });

    const { getByPlaceholderText, getByText } = render(<AddLocationModal {...mockProps} />);

    const nameInput = getByPlaceholderText('e.g., Home, Work, etc.');
    fireEvent.changeText(nameInput, 'My Home');

    fireEvent.press(getByText('Use Current Location'));

    await waitFor(() => {
      expect(mockStore.createLocation).toHaveBeenCalledWith(
        'My Home',
        40.7128,
        -74.0060,
        '123 Main St, New York, NY'
      );
    });
  });
});