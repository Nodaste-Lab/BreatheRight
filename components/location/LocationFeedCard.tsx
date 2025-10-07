import React, { useState, useEffect } from 'react';
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
import { SevereWeatherAlertCard } from '../alerts/SevereWeatherAlert';
import { generateLocationSummary } from '../../lib/services/openai-summary';
import { assessOverallConditions } from '../../lib/utils/condition-assessment';
import { EditLocationModal } from './EditLocationModal';

interface LocationFeedCardProps {
  data: LocationData;
  onPress: () => void;
  onRemove?: () => void;
}

export function LocationFeedCard({ data, onPress, onRemove }: LocationFeedCardProps) {
  const { location, aqi, pollen, lightning, wildfire, weather, microsoft } = data;
  const [editModalVisible, setEditModalVisible] = useState(false);
  
  // AI-generated summary state
  const [aiSummary, setAiSummary] = useState<{ headline: string; description: string } | null>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  
  // Dynamic icon system: Uses condition assessment utility to provide consistent icons
  // across home view and location detail view based on actual environmental data
  const conditionAssessment = assessOverallConditions(data);

  // Generate AI summary on component mount or data change
  useEffect(() => {
    const generateSummary = async () => {
      setIsLoadingSummary(true);
      try {
        const summary = await generateLocationSummary(data);
        setAiSummary(summary);
      } catch (error) {
        console.error('Error generating summary:', error);
        // Fallback to static content on error
        setAiSummary({
          headline: "Air Quality Update",
          description: getDescription()
        });
      } finally {
        setIsLoadingSummary(false);
      }
    };

    generateSummary();
  }, [data.location.id, data.aqi.aqi, data.pollen?.overall, data.lightning?.probability]); // Re-generate when key values change
  
  // Check if AQI has source information (from combined API)
  const aqiSources = (aqi as any)?.sources;

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
    <>
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
          <Image source={conditionAssessment.lungIcon} style={styles.LungImage} />
        </View>
        <View style={styles.locationDescriptionText}>
          <Text style={styles.locationDescriptionHeadline}>
            {isLoadingSummary ? "Generating..." : (aiSummary?.headline || "Stormy Tingles")}
          </Text>
          <Text style={styles.locationDescriptionBody}>
            {isLoadingSummary ? "Creating personalized summary..." : (aiSummary?.description || getDescription())}
          </Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Right Now</Text>
      
      {/* Weather Information */}
      {weather && !weather.error && (
        <View style={styles.weatherContainer}>
          <View style={styles.weatherMainInfo}>
            <Text style={styles.weatherTemperature}>
              {Math.round(weather.temperature.current)}°{weather.temperature.unit === 'C' ? 'C' : 'F'}
            </Text>
            <View style={styles.weatherDetails}>
              <Text style={styles.weatherConditions}>{weather.conditions.phrase}</Text>
              <Text style={styles.weatherFeelsLike}>
                Feels like {Math.round(weather.temperature.feelsLike)}°
              </Text>
            </View>
          </View>
          <View style={styles.weatherExtraInfo}>
            <Text style={styles.weatherExtraText}>
              💧 {weather.details.humidity}% • 🌪️ {Math.round(weather.details.windSpeed)} km/h • ☀️ UV {weather.details.uvIndex}
            </Text>
          </View>
        </View>
      )}


      {/* Severe Weather Alerts */}
      {microsoft?.severeAlerts?.alerts && microsoft.severeAlerts.alerts.length > 0 && (
        <View style={styles.alertsContainer}>
          <Text style={styles.alertsTitle}>⚠️ Severe Weather Alerts</Text>
          {microsoft.severeAlerts.alerts.slice(0, 2).map((alert, index) => (
            <SevereWeatherAlertCard 
              key={alert.id || index} 
              alert={alert}
              onPress={() => {
                // Could open detailed alert view
                console.log('Alert pressed:', alert.description);
              }}
            />
          ))}
        </View>
      )}

      {/* Health Indices (UV, Air Quality, etc.) */}
      {microsoft?.dailyIndices?.indices && microsoft.dailyIndices.indices.length > 0 && (
        <View style={styles.indicesContainer}>
          <Text style={styles.indicesTitle}>Health Indices</Text>
          <View style={styles.indicesGrid}>
            {microsoft.dailyIndices.indices
              .filter(index => ['UV Index', 'Air Quality', 'Outdoor Activity', 'Running'].includes(index.name))
              .slice(0, 4)
              .map((index, i) => (
                <View key={i} style={styles.indexCard}>
                  <Text style={styles.indexValue}>{index.value}</Text>
                  <Text style={styles.indexName}>{index.name}</Text>
                  <Text style={styles.indexCategory}>{index.category}</Text>
                </View>
              ))
            }
          </View>
        </View>
      )}
      
      <View style={styles.scoresContainer}>
        {/* AQI Score */}
        <View style={styles.scoreCard}>
          <View style={[styles.scoreIcon, { backgroundColor: getAQIColorSafe(aqi?.aqi) }]}>
            <Image source={conditionAssessment.aqiIcon} style={styles.scoreKawaiiImage} />
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
            <Image source={conditionAssessment.pollenIcon} style={styles.scoreKawaiiImage} />
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
            <Image source={conditionAssessment.lightningIcon} style={styles.scoreKawaiiImage} />
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
            {aqiSources.microsoft 
              ? '📊 Data from Microsoft Azure Maps'
              : '⚠️ No air quality data available'
            }
          </Text>
        </View>
      )}

      <View style={styles.footer}>
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.actionButton} onPress={() => setEditModalVisible(true)}>
            <Ionicons name="pencil-outline" size={16} color="#3B82F6" />
            <Text style={styles.editText}>Edit</Text>
          </TouchableOpacity>
          {onRemove && (
            <TouchableOpacity style={styles.actionButton} onPress={onRemove}>
              <Ionicons name="trash-outline" size={16} color="#ef4444" />
              <Text style={styles.removeText}>Remove</Text>
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.updateInfo}>
          <Ionicons name="time-outline" size={14} color={colors.text.secondary} />
          <Text style={styles.updateText}>Last update {formatUpdateTime()}</Text>
        </View>
      </View>
      </Card>
    </TouchableOpacity>

    <EditLocationModal
      visible={editModalVisible}
      location={location}
      onClose={() => setEditModalVisible(false)}
    />
    </>
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
    fontWeight: '400',
  },
  locationDescriptionBody: {
    ...fonts.body.regular,
    color: colors.burgundy,
    flexWrap: 'wrap',
    fontWeight: "400",
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
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  editText: {
    ...fonts.body.small,
    color: '#3B82F6',
    marginLeft: 4,
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
  weatherContainer: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  weatherMainInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  weatherTemperature: {
    ...fonts.headline.h2,
    color: colors.burgundy,
    marginRight: 16,
    fontWeight: 'bold',
  },
  weatherDetails: {
    flex: 1,
  },
  weatherConditions: {
    ...fonts.headline.h4,
    color: colors.burgundy,
    marginBottom: 2,
  },
  weatherFeelsLike: {
    ...fonts.body.regular,
    color: colors.text.secondary,
    fontWeight: '400',
  },
  weatherExtraInfo: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  weatherExtraText: {
    ...fonts.body.small,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  microsoftContainer: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  microsoftTitle: {
    ...fonts.body.small,
    color: colors.burgundy,
    fontWeight: '600',
    marginBottom: 8,
  },
  microsoftAQIInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  microsoftAQI: {
    ...fonts.headline.h3,
    fontWeight: 'bold',
  },
  microsoftDescription: {
    ...fonts.body.regular,
    color: colors.text.secondary,
    flex: 1,
    textAlign: 'right',
    fontWeight: '400',
  },
  dominantPollutant: {
    ...fonts.body.tiny,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  alertsContainer: {
    marginBottom: 16,
  },
  alertsTitle: {
    ...fonts.headline.h4,
    color: colors.burgundy,
    marginBottom: 12,
    textAlign: 'center',
  },
  indicesContainer: {
    marginBottom: 16,
  },
  indicesTitle: {
    ...fonts.headline.h4,
    color: colors.burgundy,
    marginBottom: 12,
  },
  indicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  indexCard: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
    width: '48%',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  indexValue: {
    ...fonts.headline.h3,
    color: colors.burgundy,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  indexName: {
    ...fonts.body.tiny,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: 2,
  },
  indexCategory: {
    ...fonts.body.tiny,
    color: colors.text.secondary,
    textAlign: 'center',
  },
});