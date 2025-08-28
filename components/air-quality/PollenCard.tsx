import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { PollenData } from '../../types/location';
import { fonts } from '../../lib/fonts';

interface PollenCardProps {
  data: PollenData;
}

export function PollenCard({ data }: PollenCardProps) {
  const getPollenColor = (level: number): string => {
    if (level <= 2) return '#10b981';  // green-500
    if (level <= 4) return '#eab308';  // yellow-500
    if (level <= 6) return '#f97316';  // orange-500
    if (level <= 8) return '#ef4444';  // red-500
    return '#7f1d1d'; // red-900
  };

  const getPollenTextColor = (level: number): string => {
    if (level <= 2) return '#15803d';  // green-700
    if (level <= 4) return '#a16207';  // yellow-700
    if (level <= 6) return '#c2410c';  // orange-700
    if (level <= 8) return '#b91c1c';  // red-700
    return '#7f1d1d'; // red-900
  };

  const formatTime = (timestamp: string): string => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getBarWidth = (value: number): string => {
    return `${Math.min(value * 10, 100)}%`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Pollen Count</Text>
        <Text style={styles.timestamp}>Updated {formatTime(data.timestamp)}</Text>
      </View>

      <View style={styles.mainContent}>
        <View style={[styles.pollenCircle, { backgroundColor: getPollenColor(data.overall >= 0 ? data.overall : 0) }]}>
          <Text style={styles.pollenValue}>{data.overall >= 0 ? data.overall : 'N/A'}</Text>
        </View>
        <View style={styles.pollenInfo}>
          <Text style={[styles.levelText, { color: getPollenTextColor(data.overall >= 0 ? data.overall : 0) }]}>
            {data.level !== 'Unknown' ? data.level : 'N/A'}
          </Text>
          <Text style={styles.levelLabel}>Pollen Level</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Pollen Breakdown</Text>
      <View style={styles.pollenBreakdown}>
        <View style={styles.pollenItem}>
          <View style={styles.pollenItemHeader}>
            <Text style={styles.pollenItemLabel}>Tree Pollen</Text>
            <Text style={styles.pollenItemValue}>{data.tree >= 0 ? `${data.tree}/10` : 'N/A'}</Text>
          </View>
          <View style={styles.progressBarContainer}>
            <View 
              style={[
                styles.progressBar, 
                { 
                  width: data.tree >= 0 ? getBarWidth(data.tree) : '0%',
                  backgroundColor: getPollenColor(data.tree >= 0 ? data.tree : 0)
                }
              ]}
            />
          </View>
        </View>

        <View style={styles.pollenItem}>
          <View style={styles.pollenItemHeader}>
            <Text style={styles.pollenItemLabel}>Grass Pollen</Text>
            <Text style={styles.pollenItemValue}>{data.grass >= 0 ? `${data.grass}/10` : 'N/A'}</Text>
          </View>
          <View style={styles.progressBarContainer}>
            <View 
              style={[
                styles.progressBar, 
                { 
                  width: data.grass >= 0 ? getBarWidth(data.grass) : '0%',
                  backgroundColor: getPollenColor(data.grass >= 0 ? data.grass : 0)
                }
              ]}
            />
          </View>
        </View>

        <View style={styles.pollenItem}>
          <View style={styles.pollenItemHeader}>
            <Text style={styles.pollenItemLabel}>Weed Pollen</Text>
            <Text style={styles.pollenItemValue}>{data.weed >= 0 ? `${data.weed}/10` : 'N/A'}</Text>
          </View>
          <View style={styles.progressBarContainer}>
            <View 
              style={[
                styles.progressBar, 
                { 
                  width: data.weed >= 0 ? getBarWidth(data.weed) : '0%',
                  backgroundColor: getPollenColor(data.weed >= 0 ? data.weed : 0)
                }
              ]}
            />
          </View>
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
  pollenCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  pollenValue: {
    color: 'white',
    fontSize: 20,
    fontFamily: fonts.weight.bold,
  },
  pollenInfo: {
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
  pollenBreakdown: {
    gap: 12,
  },
  pollenItem: {
    marginBottom: 12,
  },
  pollenItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  pollenItemLabel: {
    ...fonts.body.small,
    color: '#6b7280',
  },
  pollenItemValue: {
    ...fonts.body.small,
    fontFamily: fonts.weight.semibold,
    color: '#111827',
  },
  progressBarContainer: {
    backgroundColor: '#e5e7eb',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
});