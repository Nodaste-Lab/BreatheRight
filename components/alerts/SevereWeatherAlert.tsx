import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fonts } from '../../lib/fonts';
import { colors } from '../../lib/colors/theme';
import type { SevereWeatherAlert } from '../../types/location';

interface SevereWeatherAlertProps {
  alert: SevereWeatherAlert;
  onPress?: () => void;
}

export function SevereWeatherAlertCard({ alert, onPress }: SevereWeatherAlertProps) {
  // Get alert color based on severity
  const getAlertColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'minor':
      case 'moderate':
        return '#f59e0b'; // yellow
      case 'severe':
        return '#ef4444'; // red
      case 'extreme':
        return '#991b1b'; // dark red
      default:
        return '#6b7280'; // gray
    }
  };

  // Get alert icon based on category
  const getAlertIcon = (category: string) => {
    const cat = category.toLowerCase();
    if (cat.includes('thunderstorm') || cat.includes('storm')) return 'thunderstorm-outline';
    if (cat.includes('tornado')) return 'funnel-outline';
    if (cat.includes('flood') || cat.includes('water')) return 'water-outline';
    if (cat.includes('fire') || cat.includes('smoke')) return 'flame-outline';
    if (cat.includes('wind')) return 'cloudy-outline';
    if (cat.includes('snow') || cat.includes('ice')) return 'snow-outline';
    if (cat.includes('heat') || cat.includes('temperature')) return 'thermometer-outline';
    if (cat.includes('fog') || cat.includes('visibility')) return 'eye-off-outline';
    return 'warning-outline';
  };

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const alertColor = getAlertColor(alert.severity);

  return (
    <TouchableOpacity 
      style={[styles.container, { borderLeftColor: alertColor }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Ionicons 
            name={getAlertIcon(alert.category) as any} 
            size={24} 
            color={alertColor} 
          />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.category}>{alert.category}</Text>
          <Text style={[styles.severity, { color: alertColor }]}>
            {alert.severity} • Priority {alert.priority}
          </Text>
        </View>
      </View>
      
      <Text style={styles.description} numberOfLines={3}>
        {alert.description}
      </Text>
      
      <View style={styles.footer}>
        <View style={styles.timeInfo}>
          <Ionicons name="time-outline" size={14} color={colors.text.secondary} />
          <Text style={styles.timeText}>
            {formatTime(alert.startTime)} - {formatTime(alert.endTime)}
          </Text>
        </View>
        <Text style={styles.area}>{alert.area}</Text>
      </View>

      <View style={styles.sourceContainer}>
        <Text style={styles.source}>Source: {alert.source}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    marginVertical: 6,
    marginHorizontal: 16,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  category: {
    ...fonts.headline.h4,
    color: colors.burgundy,
    marginBottom: 2,
  },
  severity: {
    ...fonts.body.small,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  description: {
    ...fonts.body.regular,
    color: colors.text.primary,
    lineHeight: 20,
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 8,
  },
  timeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  timeText: {
    ...fonts.body.tiny,
    color: colors.text.secondary,
    marginLeft: 4,
  },
  area: {
    ...fonts.body.tiny,
    color: colors.text.secondary,
    textAlign: 'right',
    flex: 1,
  },
  sourceContainer: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  source: {
    ...fonts.body.tiny,
    color: colors.text.secondary,
    textAlign: 'center',
  },
});