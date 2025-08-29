import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fonts } from '../../lib/fonts';
import type { LocationData } from '../../types/location';
import { getAQIColorByValue, getAQITextColorByValue } from '../../lib/colors/aqi-colors';
import { 
  getPollenColor, 
  getPollenTextColor,
  getLightningColor, 
  getLightningTextColor,
  getWildfireColor,
  getWildfireTextColor,
  UNAVAILABLE_COLOR 
} from '../../lib/colors/environmental-colors';
import { Card } from '../ui/Card';
import { colors } from '../../lib/colors/theme';

interface LocationFeedCardProps {
  data: LocationData;
  onPress: () => void;
  onRemove?: () => void;
}

export function LocationFeedCard({ data, onPress, onRemove }: LocationFeedCardProps) {
  const { location, aqi, pollen, lightning, wildfire } = data;
  
  // Check if AQI has source information (from combined API)
  const aqiSources = (aqi as any)?.sources;
  const aqiConfidence = (aqi as any)?.confidence;
  const aqiDiscrepancy = (aqi as any)?.discrepancy;

  // Display full address but truncate at 20 characters
  const getDisplayAddress = (address: string) => {
    if (!address) return '';
    return address.length > 25 ? address.substring(0, 25) + '...' : address;
  };

  // Get AQI color (with fallback for N/A values)
  const getAQIColorSafe = (value: number | null | undefined) => {
    if (!value || value < 0) return UNAVAILABLE_COLOR;
    return getAQIColorByValue(value);
  };

  // Get appropriate kawaii image based on score
  const getAQIImage = (score: number | null | undefined) => {
    if (!score || score < 0) return require('../../assets/kawaii/aqi-good.png');
    if (score <= 100) return require('../../assets/kawaii/aqi-good.png');
    if (score <= 200) return require('../../assets/kawaii/aqi-moderate.png');
    return require('../../assets/kawaii/aqi-unhealthy.png');
  };

  const getPollenImage = (score: number | null | undefined) => {
    if (!score || score < 0) return require('../../assets/kawaii/pollen-good.png');
    const scaledScore = score * 10; // Convert to 0-100 scale
    if (scaledScore <= 100) return require('../../assets/kawaii/pollen-good.png');
    if (scaledScore <= 200) return require('../../assets/kawaii/pollen-moderate.png');
    return require('../../assets/kawaii/pollen-unhealthy.png');
  };

  const getLightningImage = (probability: number | null | undefined) => {
    if (!probability || probability < 0) return require('../../assets/kawaii/storm-good.png');
    if (probability <= 100) return require('../../assets/kawaii/storm-good.png');
    if (probability <= 200) return require('../../assets/kawaii/storm-moderate.png');
    return require('../../assets/kawaii/storm-unhealthy.png');
  };


  // Get description text
  const getDescription = () => {
    // Check for errors
    if (aqi?.error || pollen?.error || wildfire?.error) {
      return 'Data temporarily unavailable';
    }
    
    // Check for wildfire smoke conditions first (priority)
    if (wildfire?.smokeRisk && wildfire.smokeRisk.level !== 'Unknown' && wildfire.smokeRisk.level !== 'Low') {
      return `${wildfire.smokeRisk.level.toLowerCase()} smoke conditions detected`;
    }
    
    // Check if we have valid data
    if (aqi && aqi.aqi >= 0 && pollen && pollen.overall >= 0) {
      const aqiStatus = aqi.aqi <= 50 ? 'clean air' : 'elevated pollution';
      const pollenStatus = pollen.overall <= 3 ? 'low pollen' : 'high pollen';
      return `Currently experiencing ${aqiStatus} with ${pollenStatus}`;
    }
    
    return 'Air quality data unavailable';
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
      onPress={onPress} 
      activeOpacity={0.7}
      testID="location-card-touchable"
    >
      <Card variant="default" style={styles.container}>
      <View style={styles.header}>
        <View style={styles.locationInfo}>
          <Ionicons name="navigate-outline" size={19} color={colors.burgundy} />
          <View style={styles.locationText}>
            <Text style={styles.locationName}>
              {location.name} <Text style={styles.locationAddress}>{getDisplayAddress(location.address)}</Text>
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.locationDescription}>
        <View style={styles.locationDescriptionIcon}>
          <Image source={require('../../assets/kawaii/lungs-good.png')} style={styles.LungImage} />
        </View>
        <View style={styles.locationDescriptionText}>
          <Text style={styles.locationDescriptionHeadline}>Stormy Tingles</Text>
          <Text style={styles.locationDescriptionBody}>
            {getDescription()}
          </Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Right Now</Text>
      
      <View style={styles.scoresContainer}>
        {/* AQI Score */}
        <View style={styles.scoreCard}>
          <View style={[styles.scoreIcon, { backgroundColor: getAQIColorSafe(aqi?.aqi) }]}>
            <Image source={getAQIImage(aqi?.aqi)} style={styles.scoreKawaiiImage} />
          </View>
          <View style={[styles.scoreValueContainer, { backgroundColor: getAQIColorSafe(aqi?.aqi) }]}>
            <Text style={[styles.scoreValue, { color: colors.burgundy }]}>
              {aqi && aqi.aqi >= 0 ? aqi.aqi : 'N/A'}
            </Text>
          </View>
          {/* <Text style={styles.scoreLabel}>Air</Text>
          {aqiSources && (
            <Text style={styles.sourceIndicator}>
              {(() => {
                const sourceCount = [aqiSources.google, aqiSources.openweather, aqiSources.waqi, aqiSources.purpleair, aqiSources.airnow].filter(Boolean).length;
                return '●'.repeat(sourceCount) + '○'.repeat(5 - sourceCount);
              })()}
            </Text>
          )} */}
        </View>

        {/* Pollen Score */}
        <View style={styles.scoreCard}>
          <View style={[styles.scoreIcon, { backgroundColor: getPollenColor(pollen?.overall)}]}>
            <Image source={getPollenImage(pollen?.overall)} style={styles.scoreKawaiiImage} />
          </View>
          <View style={[styles.scoreValueContainer, { backgroundColor: getPollenColor(pollen?.overall) }]}>
            <Text style={[styles.scoreValue, { color: colors.burgundy }]}>
              {pollen && pollen.overall >= 0 ? `${pollen.overall * 10}` : 'N/A'}
            </Text>
          </View>
          {/* <Text style={styles.scoreLabel}>Pollen</Text> */}
        </View>

        {/* Lightning Score */}
        <View style={styles.scoreCard}>
          <View style={[styles.scoreIcon, { backgroundColor: getLightningColor(lightning?.probability) }]}>
            <Image source={getLightningImage(lightning?.probability)} style={styles.scoreKawaiiImage} />
          </View>
          <View style={[styles.scoreValueContainer, { backgroundColor: getLightningColor(lightning?.probability) }]}>
            <Text style={[styles.scoreValue, { color: colors.burgundy }]}>
              {lightning && lightning.probability >= 0 ? `${lightning.probability}%` : 'N/A'}
            </Text>
          </View>
          {/* <Text style={styles.scoreLabel}>Storm</Text> */}
        </View>

        {/* Wildfire Score */}
        {/* <View style={styles.scoreCard}>
          <View style={[styles.scoreIcon, { backgroundColor: getWildfireColor(wildfire?.smokeRisk?.level) + '20' }]}>
            <Text style={styles.scoreEmoji}>🔥</Text>
          </View>
          <Text style={[styles.scoreValue, { color: getWildfireColor(wildfire?.smokeRisk?.level) }]}>
            {wildfire?.smokeRisk?.pm25 && wildfire.smokeRisk.pm25 >= 0 ? wildfire.smokeRisk.pm25 : 'N/A'}
          </Text>
          <Text style={styles.scoreLabel}>Smoke</Text>
        </View> */}
      </View>

      {/* Data source info */}
      {aqiSources && (
        <View style={styles.dataSourceContainer}>
          <Text style={styles.dataSourceText}>
            {aqiDiscrepancy?.detected 
              ? `⚠️ ${aqiDiscrepancy.details}`
              : (() => {
                  const activeSources = [];
                  if (aqiSources.google) activeSources.push('Google');
                  if (aqiSources.openweather) activeSources.push('OpenWeather');
                  if (aqiSources.waqi) activeSources.push('WAQI');
                  if (aqiSources.purpleair) activeSources.push('PurpleAir');
                  if (aqiSources.airnow) activeSources.push('AirNow');
                  
                  if (activeSources.length === 0) return '⚠️ Using estimated data';
                  if (activeSources.length === 1) return `📊 Source: ${activeSources[0]}`;
                  if (activeSources.length === 2) return `📊 Combined: ${activeSources.join(' + ')}`;
                  if (activeSources.length === 3) return `📊 Triple-source: ${activeSources.join(' + ')}`;
                  if (activeSources.length === 4) return `📊 Quad-source: ${activeSources.join(' + ')}`;
                  return `📊 Penta-source: ${activeSources.join(' + ')}`;
                })()}
          </Text>
        </View>
      )}

      <View style={styles.footer}>
        {onRemove && (
          <TouchableOpacity style={styles.removeButton} onPress={onRemove}>
            <Ionicons name="trash-outline" size={16} color="#ef4444" />
            <Text style={styles.removeText}>Remove</Text>
          </TouchableOpacity>
        )}
        <View style={styles.updateInfo}>
          <Ionicons name="time-outline" size={14} color={colors.text.secondary} />
          <Text style={styles.updateText}>Last update {formatUpdateTime()}</Text>
        </View>
      </View>
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
  LungImage: {
    width: 122,
    height: 122,
    resizeMode: 'contain',
  },
  header: {
    marginBottom: 12,
    flexDirection: 'column',
  },
  locationDescription: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationDescriptionIcon: {
    marginRight: 15,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  locationDescriptionText: {
    marginRight: 4,
    flex: 1,
  },
  locationDescriptionHeadline: {
    ...fonts.headline.h4,
    color: colors.burgundy,
    flexWrap: 'wrap',
  },
  locationDescriptionBody: {
    ...fonts.body.regular,
    color: colors.burgundy,
    flexWrap: 'wrap',
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationText: {
    marginLeft: 8,
    flex: 1,
  },
  locationName: {
    ...fonts.headline.h4,
    color: colors.burgundy,
  },
  locationAddress: {
    ...fonts.body.tiny,
    color: colors.burgundy,
  },
  description: {
    ...fonts.body.regular,
    color: '#4b5563',
    marginBottom: 16,
    lineHeight: 22,
  },
  sectionTitle: {
     ...fonts.headline.h4,
    color: colors.burgundy,
    marginBottom: 8,
    marginTop: 16,
  },
  scoresContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  scoreCard: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 4, // 4px on each side = 8px total gap between items
  },
  scoreIcon: {
    width: '100%',
    aspectRatio: 1, // Makes it a square based on the width
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    padding: 12,
  },
  scoreEmoji: {
    fontSize: 24,
  },
  scoreKawaiiImage: {
    width: '125%', // Takes 90% of the scoreIcon container width
    height: '125%', // Maintains aspect ratio within the square container
    resizeMode: 'contain',
  },
  scoreValueContainer: {
    backgroundColor: 'transparent', // Will be overridden by dynamic color
    borderRadius: 12,
    paddingLeft: 15,
    paddingRight: 15,
    paddingTop: 8,
    marginBottom: 4,
    minWidth: 40,
    alignItems: 'center',
  },
  scoreValue: {
    ...fonts.headline.h3,
    fontWeight: 'bold',
  },
  scoreLabel: {
    ...fonts.body.tiny,
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
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
    color: colors.text.secondary,
    marginLeft: 4,
  },
  sourceIndicator: {
    fontSize: 8,
    color: '#10b981',
    marginTop: 2,
  },
  dataSourceContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  dataSourceText: {
    ...fonts.body.tiny,
    color: colors.text.secondary,
    textAlign: 'center',
  },
});