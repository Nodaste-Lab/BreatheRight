import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { fonts } from '../../lib/fonts';
import { colors } from '../../lib/colors/theme';
import { getAQIColorByValue } from '../../lib/colors/aqi-colors';
import type { AQIData } from '../../types/location';

interface AQIHistogramProps {
  forecast: AQIData[];
  title?: string;
  showTimeLabels?: boolean;
}

const { width: screenWidth } = Dimensions.get('window');
const CHART_PADDING = 40;
const CHART_WIDTH = screenWidth - CHART_PADDING * 2;

export function AQIHistogram({ forecast, title = "24-Hour Forecast", showTimeLabels = true }: AQIHistogramProps) {
  if (!forecast || forecast.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.noDataContainer}>
          <Text style={styles.noDataText}>No forecast data available</Text>
        </View>
      </View>
    );
  }

  // Calculate max AQI for scaling
  const maxAQI = Math.max(...forecast.map(f => f.aqi));
  const minAQI = Math.min(...forecast.map(f => f.aqi));
  const range = maxAQI - minAQI || 1;
  const chartHeight = 120;

  // Get bar width based on available space and number of bars
  const barSpacing = 4;
  const barWidth = Math.max(8, (CHART_WIDTH - (forecast.length - 1) * barSpacing) / forecast.length);

  // Format time labels
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const hour = date.getHours();
    
    if (hour === 0) return 'Midnight';
    if (hour === 6) return '6 am';
    if (hour === 12) return 'Noon';
    if (hour === 18) return '6 pm';
    
    return hour < 12 ? `${hour}am` : `${hour - 12}pm`;
  };

  // Show only key time labels to avoid overcrowding
  const shouldShowTimeLabel = (index: number) => {
    const date = new Date(forecast[index].timestamp);
    const hour = date.getHours();
    return hour % 6 === 0; // Show labels every 6 hours
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      
      {/* Chart container */}
      <View style={styles.chartContainer}>
        {/* Bars */}
        <View style={styles.barsContainer}>
          {forecast.map((item, index) => {
            const barHeight = ((item.aqi - minAQI) / range) * chartHeight;
            const normalizedHeight = Math.max(4, barHeight); // Minimum bar height
            
            return (
              <View key={index} style={styles.barColumn}>
                <View
                  style={[
                    styles.bar,
                    {
                      height: normalizedHeight,
                      width: barWidth,
                      backgroundColor: getAQIColorByValue(item.aqi),
                      borderWidth: 1,
                      borderColor: 'rgba(0, 0, 0, 0.40)',
                    }
                  ]}
                />
              </View>
            );
          })}
        </View>

        {/* Time labels */}
        {showTimeLabels && (
          <View style={styles.timeLabelsContainer}>
            {forecast.map((item, index) => (
              <View key={index} style={[styles.timeLabelColumn, { width: barWidth }]}>
                {shouldShowTimeLabel(index) && (
                  <Text style={styles.timeLabel}>
                    {formatTime(item.timestamp)}
                  </Text>
                )}
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Min/Max indicators */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Min</Text>
          <View style={[styles.statValue, { backgroundColor: getAQIColorByValue(minAQI) }]}>
            <Text style={styles.statValueText}>{minAQI}</Text>
          </View>
        </View>
        
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Max</Text>
          <View style={[styles.statValue, { backgroundColor: getAQIColorByValue(maxAQI) }]}>
            <Text style={styles.statValueText}>{maxAQI}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 16,
    marginVertical: 8,
  },
  title: {
    ...fonts.headline.h4,
    color: colors.text.primary,
    marginBottom: 16,
    textAlign: 'center',
  },
  noDataContainer: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noDataText: {
    fontSize: fonts.body.regular.fontSize,
    fontFamily: fonts.body.regular.fontFamily,
    color: colors.text.secondary,
  },
  chartContainer: {
    marginBottom: 16,
  },
  barsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 120,
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  barColumn: {
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  bar: {
    borderRadius: 50,
    minHeight: 4,
  },
  timeLabelsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingHorizontal: 8,
  },
  timeLabelColumn: {
    alignItems: 'center',
  },
  timeLabel: {
    ...fonts.body.tiny,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    ...fonts.body.small,
    color: colors.text.secondary,
    marginBottom: 4,
  },
  statValue: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statValueText: {
    ...fonts.headline.h4,
    color: colors.burgundy,
    fontWeight: 'bold',
  },
});