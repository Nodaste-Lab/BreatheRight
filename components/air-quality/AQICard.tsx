import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { AQIData } from '../../types/location';
import { fonts } from '../../lib/fonts';

interface AQICardProps {
  data: AQIData;
}

export function AQICard({ data }: AQICardProps) {
  const getAQIColor = (aqi: number): string => {
    if (aqi <= 50) return '#10b981';  // green-500
    if (aqi <= 100) return '#eab308'; // yellow-500
    if (aqi <= 150) return '#f97316'; // orange-500
    if (aqi <= 200) return '#ef4444'; // red-500
    if (aqi <= 300) return '#a855f7'; // purple-500
    return '#7f1d1d'; // red-900
  };

  const getAQITextColor = (aqi: number): string => {
    if (aqi <= 50) return '#15803d';  // green-700
    if (aqi <= 100) return '#a16207'; // yellow-700
    if (aqi <= 150) return '#c2410c'; // orange-700
    if (aqi <= 200) return '#b91c1c'; // red-700
    if (aqi <= 300) return '#6b21a8'; // purple-700
    return '#7f1d1d'; // red-900
  };

  const formatTime = (timestamp: string): string => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Air Quality Index</Text>
        <Text style={styles.timestamp}>Updated {formatTime(data.timestamp)}</Text>
      </View>

      <View style={styles.mainContent}>
        <View style={[styles.aqiCircle, { backgroundColor: getAQIColor(data.aqi) }]}>
          <Text style={styles.aqiValue}>{data.aqi}</Text>
        </View>
        <View style={styles.aqiInfo}>
          <Text style={[styles.levelText, { color: getAQITextColor(data.aqi) }]}>
            {data.level}
          </Text>
          <Text style={styles.levelLabel}>AQI Level</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Pollutant Breakdown</Text>
      <View style={styles.pollutantsGrid}>
        <View style={styles.pollutantCard}>
          <Text style={styles.pollutantLabel}>PM2.5</Text>
          <Text style={styles.pollutantValue}>{data.pollutants.pm25} µg/m³</Text>
        </View>
        <View style={styles.pollutantCard}>
          <Text style={styles.pollutantLabel}>PM10</Text>
          <Text style={styles.pollutantValue}>{data.pollutants.pm10} µg/m³</Text>
        </View>
        <View style={styles.pollutantCard}>
          <Text style={styles.pollutantLabel}>Ozone</Text>
          <Text style={styles.pollutantValue}>{data.pollutants.o3} µg/m³</Text>
        </View>
        <View style={styles.pollutantCard}>
          <Text style={styles.pollutantLabel}>NO2</Text>
          <Text style={styles.pollutantValue}>{data.pollutants.no2} µg/m³</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    ...fonts.headline.h5,
    color: '#111827',
  },
  timestamp: {
    ...fonts.body.small,
    color: '#6b7280',
  },
  mainContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  aqiCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  aqiValue: {
    color: 'white',
    fontSize: 20,
    fontFamily: fonts.weight.bold,
  },
  aqiInfo: {
    flex: 1,
  },
  levelText: {
    ...fonts.headline.h3,
    marginBottom: 4,
  },
  levelLabel: {
    ...fonts.body.small,
    color: '#6b7280',
  },
  sectionTitle: {
    ...fonts.body.small,
    fontFamily: fonts.weight.semibold,
    color: '#111827',
    marginBottom: 12,
  },
  pollutantsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  pollutantCard: {
    width: '48%',
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 8,
    marginHorizontal: '1%',
    marginBottom: 12,
  },
  pollutantLabel: {
    ...fonts.body.tiny,
    color: '#6b7280',
    marginBottom: 4,
  },
  pollutantValue: {
    ...fonts.body.regular,
    fontFamily: fonts.weight.semibold,
    color: '#111827',
  },
});