import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { AQIData } from '../../types/location';
import { fonts } from '../../lib/fonts';
import { getAQITextColorByValue, getAQICategory } from '../../lib/colors/aqi-colors';
import { Card } from '../ui/Card';

interface AQICardProps {
  data: AQIData;
}

export function AQICard({ data }: AQICardProps) {
  // Check if this is combined data
  const sources = (data as any)?.sources;
  const confidence = (data as any)?.confidence;
  const discrepancy = (data as any)?.discrepancy;
  
  // Get AQI category info with our new color system
  const aqiCategory = getAQICategory(data.aqi);

  const formatTime = (timestamp: string): string => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <Card>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Air Quality Index</Text>
          {sources && (
            <Text style={styles.sourceText}>
              {(() => {
                const activeSources = [];
                if (sources.google) activeSources.push('Google');
                if (sources.openweather) activeSources.push('OpenWeather');
                if (sources.waqi) activeSources.push('WAQI');
                if (sources.purpleair) activeSources.push('PurpleAir');
                if (sources.airnow) activeSources.push('AirNow');
                
                if (activeSources.length === 0) return '';
                if (activeSources.length === 1) return `📊 ${activeSources[0]}`;
                if (activeSources.length === 2) return `📊 ${activeSources.join(' + ')}`;
                if (activeSources.length === 3) return `📊 ${activeSources.join(' + ')}`;
                if (activeSources.length === 4) return `📊 ${activeSources.join(' + ')}`;
                return `📊 ${activeSources.join(' + ')}`;
              })()}
            </Text>
          )}
        </View>
        <Text style={styles.timestamp}>Updated {formatTime(data.timestamp)}</Text>
      </View>

      <View style={styles.mainContent}>
        <View style={[styles.aqiCircle, { backgroundColor: aqiCategory.color }]}>
          <Text style={styles.aqiValue}>{data.aqi >= 0 ? data.aqi : 'N/A'}</Text>
        </View>
        <View style={styles.aqiInfo}>
          <Text style={[styles.levelText, { color: aqiCategory.textColor }]}>
            {data.level !== 'Unknown' ? data.level : 'N/A'}
          </Text>
          <Text style={styles.levelLabel}>AQI Level</Text>
        </View>
      </View>

      {sources && (
        <View style={styles.confidenceContainer}>
          <Text style={styles.confidenceLabel}>Data confidence: </Text>
          <Text style={[styles.confidenceText, 
            { color: confidence === 'high' ? getAQITextColorByValue(30) : 
                     confidence === 'medium' ? getAQITextColorByValue(75) : 
                     confidence === 'conflicting' ? getAQITextColorByValue(175) : '#9ca3af' }]}>
            {confidence === 'high' ? 'High (sources agree)' : 
             confidence === 'medium' ? 'Medium (single source)' : 
             confidence === 'conflicting' ? 'Low (sources conflict)' :
             'Low (estimated)'}
          </Text>
        </View>
      )}

      {discrepancy?.detected && (
        <View style={styles.warningContainer}>
          <Text style={styles.warningText}>
            ⚠️ {discrepancy.details}
          </Text>
          {(data as any)?.rawData && (
            <Text style={styles.rawDataText}>
              {[
                (data as any).rawData.google?.aqi >= 0 ? `Google: ${(data as any).rawData.google.aqi}` : null,
                (data as any).rawData.openweather?.aqi >= 0 ? `OpenWeather: ${(data as any).rawData.openweather.aqi}` : null,
                (data as any).rawData.waqi?.aqi >= 0 ? `WAQI: ${(data as any).rawData.waqi.aqi}` : null,
                (data as any).rawData.purpleair?.aqi >= 0 ? `PurpleAir: ${(data as any).rawData.purpleair.aqi}` : null,
                (data as any).rawData.airnow?.aqi >= 0 ? `AirNow: ${(data as any).rawData.airnow.aqi}` : null
              ].filter(Boolean).join(' • ')}
            </Text>
          )}
        </View>
      )}

      <Text style={styles.sectionTitle}>Pollutant Breakdown</Text>
      <View style={styles.pollutantsGrid}>
        <View style={styles.pollutantCard}>
          <Text style={styles.pollutantLabel}>PM2.5</Text>
          <Text style={styles.pollutantValue}>
            {data.pollutants.pm25 >= 0 ? `${data.pollutants.pm25} µg/m³` : 'N/A'}
          </Text>
        </View>
        <View style={styles.pollutantCard}>
          <Text style={styles.pollutantLabel}>PM10</Text>
          <Text style={styles.pollutantValue}>
            {data.pollutants.pm10 >= 0 ? `${data.pollutants.pm10} µg/m³` : 'N/A'}
          </Text>
        </View>
        <View style={styles.pollutantCard}>
          <Text style={styles.pollutantLabel}>Ozone</Text>
          <Text style={styles.pollutantValue}>
            {data.pollutants.o3 >= 0 ? `${data.pollutants.o3} µg/m³` : 'N/A'}
          </Text>
        </View>
        <View style={styles.pollutantCard}>
          <Text style={styles.pollutantLabel}>NO2</Text>
          <Text style={styles.pollutantValue}>
            {data.pollutants.no2 >= 0 ? `${data.pollutants.no2} µg/m³` : 'N/A'}
          </Text>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    ...fonts.headline.h5,
    color: '#491124',
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
  sourceText: {
    ...fonts.body.tiny,
    color: '#9ca3af',
    marginTop: 2,
  },
  confidenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  confidenceLabel: {
    ...fonts.body.small,
    color: '#6b7280',
  },
  confidenceText: {
    ...fonts.body.small,
    fontFamily: fonts.weight.semibold,
  },
  warningContainer: {
    backgroundColor: '#fef3c7',
    borderLeftWidth: 3,
    borderLeftColor: '#f59e0b',
    padding: 12,
    marginBottom: 16,
    borderRadius: 6,
  },
  warningText: {
    ...fonts.body.small,
    color: '#92400e',
    marginBottom: 4,
  },
  rawDataText: {
    ...fonts.body.tiny,
    color: '#78716c',
    fontFamily: fonts.weight.regular,
  },
  pollutantsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  pollutantCard: {
    width: '48%',
    backgroundColor: '#f3f4f6',
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