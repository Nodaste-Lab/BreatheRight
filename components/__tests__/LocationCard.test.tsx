import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { LocationCard } from '../location/LocationCard';
import { useLocationStore } from '../../store/location';
import type { Location } from '../../types/location';

// Mock the store
jest.mock('../../store/location');
const mockUseLocationStore = useLocationStore as jest.MockedFunction<typeof useLocationStore>;

// Mock Alert
jest.spyOn(Alert, 'alert');

describe('LocationCard', () => {
  const mockLocation: Location = {
    id: 'loc1',
    user_id: 'user1',
    name: 'Home',
    address: '123 Main St, New York, NY',
    latitude: 40.7128,
    longitude: -74.0060,
    show_in_home: false,
    notify_daily: true,
    created_at: '2024-01-01T00:00:00Z',
  };

  const mockPrimaryLocation: Location = {
    ...mockLocation,
    id: 'loc2',
    name: 'Work',
    show_in_home: true,
  };

  const mockProps = {
    location: mockLocation,
    onPress: jest.fn(),
    onDelete: jest.fn(),
  };

  const mockStore = {
    setLocationAsPrimary: jest.fn(),
    deleteLocation: jest.fn(),
    loading: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseLocationStore.mockReturnValue(mockStore as any);
  });

  it('renders location information correctly', () => {
    const { getByText } = render(<LocationCard {...mockProps} />);

    expect(getByText('Home')).toBeTruthy();
    expect(getByText('123 Main St, New York, NY')).toBeTruthy();
    expect(getByText('40.712800, -74.006000')).toBeTruthy();
  });

  it('shows PRIMARY badge for primary location', () => {
    const { getByText } = render(
      <LocationCard {...mockProps} location={mockPrimaryLocation} />
    );

    expect(getByText('PRIMARY')).toBeTruthy();
    expect(getByText('Work')).toBeTruthy();
  });

  it('shows star icon for non-primary locations', () => {
    const { getByTestId } = render(<LocationCard {...mockProps} />);

    // The star icon should be present for non-primary locations
    // Note: You might need to add testID props to the TouchableOpacity in LocationCard
    expect(() => getByTestId('star-button')).not.toThrow();
  });

  it('does not show star icon for primary locations', () => {
    const { queryByTestId } = render(
      <LocationCard {...mockProps} location={mockPrimaryLocation} />
    );

    // The star icon should not be present for primary locations
    expect(queryByTestId('star-button')).toBeFalsy();
  });

  it('calls onPress when card is pressed', () => {
    const { getByText } = render(<LocationCard {...mockProps} />);

    fireEvent.press(getByText('Home'));

    expect(mockProps.onPress).toHaveBeenCalled();
  });

  it('handles setting location as primary successfully', async () => {
    mockStore.setLocationAsPrimary.mockResolvedValue(undefined);

    const { getByTestId } = render(<LocationCard {...mockProps} />);

    // You'll need to add testID="star-button" to the star TouchableOpacity in LocationCard
    const starButton = getByTestId('star-button');
    fireEvent.press(starButton);

    await waitFor(() => {
      expect(mockStore.setLocationAsPrimary).toHaveBeenCalledWith('loc1');
    });

    expect(Alert.alert).toHaveBeenCalledWith('Success', 'Primary location updated!');
  });

  it('handles set primary error', async () => {
    mockStore.setLocationAsPrimary.mockRejectedValue(new Error('Network error'));

    const { getByTestId } = render(<LocationCard {...mockProps} />);

    const starButton = getByTestId('star-button');
    fireEvent.press(starButton);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Failed to update primary location');
    });
  });

  it('shows delete confirmation dialog', () => {
    const { getByTestId } = render(<LocationCard {...mockProps} />);

    // You'll need to add testID="delete-button" to the delete TouchableOpacity in LocationCard
    const deleteButton = getByTestId('delete-button');
    fireEvent.press(deleteButton);

    expect(Alert.alert).toHaveBeenCalledWith(
      'Delete Location',
      'Are you sure you want to delete "Home"?',
      expect.arrayContaining([
        expect.objectContaining({ text: 'Cancel', style: 'cancel' }),
        expect.objectContaining({ text: 'Delete', style: 'destructive' }),
      ])
    );
  });

  it('handles delete confirmation', async () => {
    mockStore.deleteLocation.mockResolvedValue(undefined);

    // Mock Alert.alert to automatically confirm delete
    (Alert.alert as jest.Mock).mockImplementation((title, message, buttons) => {
      const deleteButton = buttons?.find((btn: any) => btn.text === 'Delete');
      if (deleteButton?.onPress) {
        deleteButton.onPress();
      }
    });

    const { getByTestId } = render(<LocationCard {...mockProps} />);

    const deleteButton = getByTestId('delete-button');
    fireEvent.press(deleteButton);

    await waitFor(() => {
      expect(mockStore.deleteLocation).toHaveBeenCalledWith('loc1');
    });

    expect(mockProps.onDelete).toHaveBeenCalled();
  });

  it('handles delete error', async () => {
    mockStore.deleteLocation.mockRejectedValue(new Error('Delete failed'));

    (Alert.alert as jest.Mock).mockImplementation((title, message, buttons) => {
      const deleteButton = buttons?.find((btn: any) => btn.text === 'Delete');
      if (deleteButton?.onPress) {
        deleteButton.onPress();
      }
    });

    const { getByTestId } = render(<LocationCard {...mockProps} />);

    const deleteButton = getByTestId('delete-button');
    fireEvent.press(deleteButton);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Failed to delete location');
    });
  });

  it('disables interactions when loading', () => {
    mockUseLocationStore.mockReturnValue({
      ...mockStore,
      loading: true,
    } as any);

    const { getByText } = render(<LocationCard {...mockProps} />);

    const card = getByText('Home').parent;
    expect(card).toHaveStyle({ opacity: 0.5 }); // Assuming disabled style
  });
});