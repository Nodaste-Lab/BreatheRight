import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../../components/ui/Card';
import { fonts } from '../../lib/fonts';
import { colors } from '@/lib/colors/theme';
import { GradientBackground } from '@/components/ui/GradientBackground';

export default function AlertsScreen() {
  return (
    <GradientBackground>
      <SafeAreaView style={[styles.container, { backgroundColor: 'transparent' }]}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Alerts</Text>
          <Text style={styles.subtitle}>Stay informed about air quality changes</Text>
        </View>

        <View style={styles.content}>
          {/* No Alerts State */}
          <Card>
            <View style={styles.emptyState}>
              <Ionicons name="notifications-off-outline" size={48} color="#9ca3af" />
              <Text style={styles.emptyTitle}>No Active Alerts</Text>
              <Text style={styles.emptyText}>
                You'll receive notifications when air quality conditions change significantly in your saved locations
              </Text>
            </View>
          </Card>

          {/* Alert Settings Preview */}
          <Card>
            <Text style={styles.sectionTitle}>Alert Preferences</Text>
            <View style={styles.preferenceItem}>
              <Ionicons name="warning-outline" size={20} color="#491124" />
              <View style={styles.preferenceText}>
                <Text style={styles.preferenceName}>Poor Air Quality</Text>
                <Text style={styles.preferenceDescription}>Get notified when AQI exceeds 100</Text>
              </View>
            </View>
            <View style={styles.preferenceItem}>
              <Ionicons name="flower-outline" size={20} color="#491124" />
              <View style={styles.preferenceText}>
                <Text style={styles.preferenceName}>High Pollen Count</Text>
                <Text style={styles.preferenceDescription}>Alert when pollen levels are high</Text>
              </View>
            </View>
            <View style={styles.preferenceItem}>
              <Ionicons name="thunderstorm-outline" size={20} color="#491124" />
              <View style={styles.preferenceText}>
                <Text style={styles.preferenceName}>Severe Weather</Text>
                <Text style={styles.preferenceDescription}>Storm and lightning warnings</Text>
              </View>
            </View>
          </Card>

          {/* Coming Soon */}
          <Card>
            <View style={styles.comingSoon}>
              <Ionicons name="construct-outline" size={32} color="#491124" />
              <Text style={styles.comingSoonTitle}>Coming Soon</Text>
              <Text style={styles.comingSoonText}>
                Custom alert thresholds, schedule-based notifications, and location-specific alerts
              </Text>
            </View>
          </Card>
        </View>
        </ScrollView>
      </SafeAreaView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  title: {
    ...fonts.headline.h2,
    color: '#491124',
    marginBottom: 4,
  },
  subtitle: {
    ...fonts.body.regular,
    color: '#6b7280',
  },
  content: {
    padding: 16,
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    ...fonts.headline.h4,
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    ...fonts.body.regular,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 22,
  },
  sectionTitle: {
    ...fonts.headline.h5,
    color: '#111827',
    marginBottom: 16,
  },
  preferenceItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  preferenceText: {
    marginLeft: 12,
    flex: 1,
  },
  preferenceName: {
    ...fonts.body.regular,
    fontFamily: fonts.weight.semibold,
    color: '#111827',
    marginBottom: 2,
  },
  preferenceDescription: {
    ...fonts.body.small,
    color: '#6b7280',
  },
  comingSoon: {
    alignItems: 'center',
    padding: 24,
  },
  comingSoonTitle: {
    ...fonts.headline.h5,
    color: '#491124',
    marginTop: 12,
    marginBottom: 8,
  },
  comingSoonText: {
    ...fonts.body.regular,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 22,
  },
});