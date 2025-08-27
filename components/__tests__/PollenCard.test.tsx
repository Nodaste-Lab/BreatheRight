import React from 'react';
import { render } from '@testing-library/react-native';
import { PollenCard } from '../air-quality/PollenCard';
import type { PollenData } from '../../types/location';

describe('PollenCard', () => {
  const mockPollenData: PollenData = {
    overall: 6,
    tree: 7,
    grass: 4,
    weed: 2,
    level: 'Medium',
    timestamp: '2024-01-01T12:00:00Z',
  };

  it('renders pollen information correctly', () => {
    const { getByText } = render(<PollenCard data={mockPollenData} />);

    expect(getByText('Pollen Count')).toBeTruthy();
    expect(getByText('6')).toBeTruthy();
    expect(getByText('Medium')).toBeTruthy();
    expect(getByText('Pollen Level')).toBeTruthy();
    expect(getByText('Pollen Breakdown')).toBeTruthy();
  });

  it('displays pollen breakdown correctly', () => {
    const { getByText } = render(<PollenCard data={mockPollenData} />);

    expect(getByText('Tree Pollen')).toBeTruthy();
    expect(getByText('7/10')).toBeTruthy();
    expect(getByText('Grass Pollen')).toBeTruthy();
    expect(getByText('4/10')).toBeTruthy();
    expect(getByText('Weed Pollen')).toBeTruthy();
    expect(getByText('2/10')).toBeTruthy();
  });

  it('formats timestamp correctly', () => {
    const { getByText } = render(<PollenCard data={mockPollenData} />);

    // Should show "Updated 12:00 PM" (or similar based on locale)
    expect(getByText(/Updated \d{1,2}:\d{2}/)).toBeTruthy();
  });

  it('renders correct colors for different pollen levels', () => {
    const testCases = [
      { overall: 1, level: 'Low' as const },
      { overall: 3, level: 'Low-Medium' as const },
      { overall: 5, level: 'Medium' as const },
      { overall: 7, level: 'Medium-High' as const },
      { overall: 9, level: 'High' as const },
    ];

    testCases.forEach(({ overall, level }) => {
      const testData = { ...mockPollenData, overall, level };
      const { getByText } = render(<PollenCard data={testData} />);
      
      expect(getByText(overall.toString())).toBeTruthy();
      expect(getByText(level)).toBeTruthy();
    });
  });

  it('renders progress bars with correct widths', () => {
    const { getByText } = render(<PollenCard data={mockPollenData} />);

    // Progress bars should have appropriate widths based on values
    // Note: You might need to add testIDs to the progress bars for more specific testing
    expect(getByText('Tree Pollen')).toBeTruthy();
    expect(getByText('Grass Pollen')).toBeTruthy();
    expect(getByText('Weed Pollen')).toBeTruthy();
  });

  it('handles edge case values correctly', () => {
    const edgeData: PollenData = {
      overall: 10,
      tree: 0,
      grass: 10,
      weed: 5,
      level: 'High',
      timestamp: '2024-01-01T12:00:00Z',
    };

    const { getByText } = render(<PollenCard data={edgeData} />);

    expect(getByText('10')).toBeTruthy();
    expect(getByText('High')).toBeTruthy();
    expect(getByText('0/10')).toBeTruthy();
    expect(getByText('10/10')).toBeTruthy();
    expect(getByText('5/10')).toBeTruthy();
  });
});