import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fonts } from '../../lib/fonts';
import type { LocationData } from '../../types/location';

interface LocationFeedCardProps {
  data: LocationData;
  onPress: () => void;
  onRemove?: () => void;
}

export function LocationFeedCard({ data, onPress, onRemove }: LocationFeedCardProps) {
  const { location, aqi, pollen, lightning } = data;

  // Truncate address to show only city/state or first part
  const truncateAddress = (address: string) => {
    const parts = address.split(',');
    if (parts.length >= 2) {
      return `${parts[parts.length - 2]}, ${parts[parts.length - 1]}`.trim();
    }
    return address.length > 30 ? address.substring(0, 30) + '...' : address;
  };

  // Get color based on AQI value
  const getAQIColor = (value: number | null | undefined) => {
    if (!value) return '#9ca3af'; // gray
    if (value <= 50) return '#10b981';  // green
    if (value <= 100) return '#eab308'; // yellow
    if (value <= 150) return '#f97316'; // orange
    return '#ef4444'; // red
  };

  // Get color based on pollen value
  const getPollenColor = (value: number | null | undefined) => {
    if (!value) return '#9ca3af'; // gray
    if (value <= 3) return '#10b981';  // green
    if (value <= 6) return '#eab308'; // yellow
    return '#f97316'; // orange
  };

  // Get color based on lightning probability
  const getLightningColor = (probability: number | null | undefined) => {
    if (!probability) return '#9ca3af'; // gray
    if (probability <= 30) return '#10b981';  // green
    if (probability <= 60) return '#eab308'; // yellow
    return '#ef4444'; // red
  };

  // Get description text (placeholder for now)
  const getDescription = () => {
    if (aqi && pollen) {
      const aqiStatus = aqi.aqi <= 50 ? 'clean air' : 'elevated pollution';
      const pollenStatus = pollen.overall <= 3 ? 'low pollen' : 'high pollen';
      return `Currently experiencing ${aqiStatus} with ${pollenStatus}`;
    }
    return 'Air quality data loading...';
  };

  // Format last update time
  const formatUpdateTime = () => {
    if (aqi?.timestamp) {
      const date = new Date(aqi.timestamp);
      const now = new Date();
      const diffMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);
      
      if (diffMinutes < 1) return 'Just now';
      if (diffMinutes < 60) return `${diffMinutes} min ago`;
      if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)} hours ago`;
      return `${Math.floor(diffMinutes / 1440)} days ago`;
    }
    return 'Updating...';
  };

  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={onPress} 
      activeOpacity={0.7}
      testID="location-card-touchable"
    >
      <View style={styles.header}>
        <View style={styles.locationInfo}>
          <Ionicons name="location-outline" size={20} color="#6b7280" />
          <View style={styles.locationText}>
            <Text style={styles.locationName}>{location.name}</Text>
            <Text style={styles.locationAddress}>{truncateAddress(location.address)}</Text>
          </View>
        </View>
      </View>

      <Text style={styles.description}>{getDescription()}</Text>

      <Text style={styles.sectionTitle}>Right Now</Text>
      
      <View style={styles.scoresContainer}>
        {/* AQI Score */}
        <View style={styles.scoreCard}>
          <View style={[styles.scoreIcon, { backgroundColor: getAQIColor(aqi?.aqi) + '20' }]}>
            <Text style={styles.scoreEmoji}>🏭</Text>
          </View>
          <Text style={[styles.scoreValue, { color: getAQIColor(aqi?.aqi) }]}>
            {aqi?.aqi || '--'}
          </Text>
          <Text style={styles.scoreLabel}>Air</Text>
        </View>

        {/* Pollen Score */}
        <View style={styles.scoreCard}>
          <View style={[styles.scoreIcon, { backgroundColor: getPollenColor(pollen?.overall) + '20' }]}>
            <Text style={styles.scoreEmoji}>🌻</Text>
          </View>
          <Text style={[styles.scoreValue, { color: getPollenColor(pollen?.overall) }]}>
            {pollen ? `${pollen.overall * 10}` : '--'}
          </Text>
          <Text style={styles.scoreLabel}>Pollen</Text>
        </View>

        {/* Lightning Score */}
        <View style={styles.scoreCard}>
          <View style={[styles.scoreIcon, { backgroundColor: getLightningColor(lightning?.probability) + '20' }]}>
            <Text style={styles.scoreEmoji}>⛈️</Text>
          </View>
          <Text style={[styles.scoreValue, { color: getLightningColor(lightning?.probability) }]}>
            {lightning ? `${lightning.probability}%` : '--'}
          </Text>
          <Text style={styles.scoreLabel}>Storm</Text>
        </View>
      </View>

      <View style={styles.footer}>
        {onRemove && (
          <TouchableOpacity style={styles.removeButton} onPress={onRemove}>
            <Ionicons name="trash-outline" size={16} color="#ef4444" />
            <Text style={styles.removeText}>Remove</Text>
          </TouchableOpacity>
        )}
        <View style={styles.updateInfo}>
          <Ionicons name="time-outline" size={14} color="#9ca3af" />
          <Text style={styles.updateText}>Last update {formatUpdateTime()}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  header: {
    marginBottom: 12,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  locationText: {
    marginLeft: 8,
    flex: 1,
  },
  locationName: {
    ...fonts.headline.h4,
    color: '#111827',
    marginBottom: 2,
  },
  locationAddress: {
    ...fonts.body.small,
    color: '#6b7280',
  },
  description: {
    ...fonts.body.regular,
    color: '#4b5563',
    marginBottom: 16,
    lineHeight: 22,
  },
  sectionTitle: {
    ...fonts.body.small,
    fontFamily: fonts.weight.semibold,
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  scoresContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  scoreCard: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  scoreIcon: {
    width: 64,
    height: 64,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  scoreEmoji: {
    fontSize: 28,
  },
  scoreValue: {
    ...fonts.headline.h3,
    marginBottom: 4,
  },
  scoreLabel: {
    ...fonts.body.tiny,
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  removeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  removeText: {
    ...fonts.body.small,
    color: '#ef4444',
    marginLeft: 4,
  },
  updateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  updateText: {
    ...fonts.body.tiny,
    color: '#9ca3af',
    marginLeft: 4,
  },
});