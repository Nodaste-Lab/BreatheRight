import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, typography, spacing, borders, radius } from '../../lib/constants';
import { getAQIColor } from '../../lib/constants';

interface ChartDataPoint {
  value: number;
  label?: string;
  isActive?: boolean;
}

interface ChartProps {
  data: ChartDataPoint[];
  height?: number;
  showLabels?: boolean;
  style?: ViewStyle;
}

export function Chart({ data, height = 100, showLabels = false, style }: ChartProps) {
  const maxValue = Math.max(...data.map(d => d.value));
  const minValue = Math.min(...data.map(d => d.value));
  
  const getBarHeight = (value: number) => {
    const range = maxValue - minValue || 1;
    const percentage = ((value - minValue) / range) * 0.7 + 0.3; // 30% min height, 70% range
    return height * percentage;
  };

  return (
    <View style={[styles.container, { height }, style]}>
      <View style={styles.barsContainer}>
        {data.map((point, index) => (
          <View key={index} style={styles.barWrapper}>
            <View style={styles.barContainer}>
              <View
                style={[
                  styles.bar,
                  {
                    height: getBarHeight(point.value),
                    backgroundColor: getAQIColor(point.value),
                    borderColor: point.isActive 
                      ? colors.ui.chartActive 
                      : colors.neutral.blackAlpha40,
                    borderWidth: point.isActive 
                      ? borders.chartBarActive 
                      : borders.chartBar,
                  },
                ]}
              />
            </View>
            {showLabels && point.label && (
              <Text style={styles.label}>{point.label}</Text>
            )}
          </View>
        ))}
      </View>
    </View>
  );
}

interface HourlyChartProps {
  hourlyData: Array<{
    hour: number;
    aqi: number;
  }>;
  currentHour?: number;
  style?: ViewStyle;
}

export function HourlyChart({ hourlyData, currentHour = 0, style }: HourlyChartProps) {
  const chartData: ChartDataPoint[] = hourlyData.map((data, index) => ({
    value: data.aqi,
    label: data.hour % 6 === 0 ? formatHour(data.hour) : undefined,
    isActive: index === 0, // First bar is current hour
  }));

  return (
    <View style={[styles.hourlyContainer, style]}>
      <Chart data={chartData} height={83} />
      <TimeMarkers hourlyData={hourlyData} />
    </View>
  );
}

function TimeMarkers({ hourlyData }: { hourlyData: Array<{ hour: number; aqi: number }> }) {
  const createMarkers = () => {
    const allMarkers = [];
    
    // Calculate chart padding to align with bars
    const chartPadding = 8; // Match spacing.chart.padding
    const containerWidth = 100; // Percentage width
    const effectiveWidth = containerWidth - (chartPadding * 2);
    
    // Always add "Now" for the first position, aligned with first bar
    allMarkers.push({
      position: chartPadding,
      label: 'Now',
      isNow: true
    });
    
    // Find other key time markers in the data with minimum spacing
    const keyTimes = [
      { hour: 6, label: '6 am' },
      { hour: 12, label: 'Noon' },
      { hour: 18, label: '6 pm' },
      { hour: 0, label: 'Midnight' },
    ];
    
    keyTimes.forEach(keyTime => {
      const index = hourlyData.findIndex(d => d.hour === keyTime.hour);
      if (index > 3 && index < hourlyData.length) { // Ensure minimum distance of 3 hours from "Now"
        const barPosition = chartPadding + ((index / (hourlyData.length - 1)) * effectiveWidth);
        
        // Check if this position has enough space from existing markers
        const hasSpace = allMarkers.every(existing => 
          Math.abs(existing.position - barPosition) > 15 // Minimum 15% spacing
        );
        
        if (hasSpace) {
          allMarkers.push({
            position: barPosition,
            label: keyTime.label,
            isNow: false
          });
        }
      }
    });
    
    // Sort by position and limit to 4 markers total
    return allMarkers
      .sort((a, b) => a.position - b.position)
      .slice(0, 4);
  };

  const markers = createMarkers();

  return (
    <View style={styles.markersContainer}>
      {markers.map((marker, index) => (
        <View
          key={index}
          style={[
            styles.marker,
            { left: `${marker.position}%` },
          ]}
        >
          <Text style={[
            styles.markerText,
            marker.isNow && styles.nowMarkerText
          ]}>
            {marker.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

function formatHour(hour: number): string {
  if (hour === 0) return 'Midnight';
  if (hour === 6) return '6 am';
  if (hour === 12) return 'Noon';
  if (hour === 18) return '6 pm';
  return hour < 12 ? `${hour} am` : hour === 12 ? '12 pm' : `${hour - 12} pm`;
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  barsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: '100%',
    paddingHorizontal: spacing.chart.padding,
  },
  barWrapper: {
    alignItems: 'center',
    flex: 1,
  },
  barContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'flex-end',
    position: 'relative',
  },
  bar: {
    width: spacing.chart.barWidth,
    borderRadius: radius.full,
    marginHorizontal: 1,
  },
  label: {
    ...typography.chartLabel,
    color: colors.text.primary,
    marginTop: spacing.xs,
  },
  hourlyContainer: {
    backgroundColor: colors.neutral.whiteAlpha20,
    borderRadius: radius.lg,
    padding: spacing.xs,
  },
  markersContainer: {
    flexDirection: 'row',
    position: 'relative',
    height: 52,
    marginTop: spacing.sm,
  },
  marker: {
    position: 'absolute',
    alignItems: 'center',
    transform: [{ translateX: -25 }], // Center the marker with text width
    minWidth: 50,
  },
  markerText: {
    ...typography.chartLabel,
    color: colors.text.primary,
    textAlign: 'center',
  },
  nowMarkerText: {
    fontWeight: 'bold',
    color: colors.primary,
  },
});