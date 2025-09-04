import React, { useState } from 'react';
import { 
  ScrollView, 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView,
  TouchableOpacity,
  Alert
} from 'react-native';
import { GradientBackground } from '../../components/ui/GradientBackground';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Accordion, AccordionItem } from '../../components/ui/Accordion';
import { Dropdown } from '../../components/ui/Dropdown';
import { Chart, HourlyChart } from '../../components/ui/Chart';
import { Input } from '../../components/ui/Input';
import { colors, typography, spacing } from '../../lib/constants';
import { Ionicons } from '@expo/vector-icons';

export default function ShowcaseScreen() {
  const [selectedLocation, setSelectedLocation] = useState('home');
  const [expandedAccordion, setExpandedAccordion] = useState<number | null>(null);

  // Sample data for components
  const locations = [
    { label: 'Home', value: 'home', sublabel: '123 Sesame Street' },
    { label: 'School', value: 'school', sublabel: '482 Privet Drive' },
    { label: 'Cabin', value: 'cabin', sublabel: '432 Snowbunny Ave' },
    { label: "Grandma's", value: 'grandmas', sublabel: '678 Ocean View Lane' },
  ];

  const hourlyData = Array.from({ length: 24 }, (_, i) => ({
    hour: (new Date().getHours() + i) % 24,
    aqi: Math.floor(Math.random() * 150) + 25,
  }));

  const chartData = [
    { value: 45, isActive: true },
    { value: 52 },
    { value: 38 },
    { value: 65 },
    { value: 89 },
    { value: 125 },
    { value: 95 },
    { value: 78 },
  ];

  return (
    <GradientBackground>
      <SafeAreaView style={styles.container}>
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>Component Showcase</Text>
          <Text style={styles.subtitle}>Figma-aligned UI Components</Text>

          {/* Cards Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Cards</Text>
            
            <Card variant="default">
              <CardHeader>
                <CardTitle>Default Card</CardTitle>
              </CardHeader>
              <CardContent>
                <Text style={styles.bodyText}>
                  This is the default card variant with semi-transparent white background,
                  matching the Figma design system.
                </Text>
              </CardContent>
            </Card>

            <Card variant="filled">
              <CardTitle>Filled Card</CardTitle>
              <Text style={styles.bodyText}>
                Solid white background with shadow.
              </Text>
            </Card>

            <Card variant="compact">
              <Text style={styles.bodyText}>Compact card with reduced padding</Text>
            </Card>
          </View>

          {/* Badges Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Badges</Text>
            
            <View style={styles.badgeContainer}>
              <Badge variant="aqi" level="good">45 Good</Badge>
              <Badge variant="aqi" level="moderate">85 Moderate</Badge>
              <Badge variant="aqi" level="unhealthy">125 Unhealthy</Badge>
            </View>

            <View style={styles.badgeContainer}>
              <Badge variant="pollen" pollenLevel="low">Low Pollen</Badge>
              <Badge variant="pollen" pollenLevel="medium">Medium</Badge>
              <Badge variant="pollen" pollenLevel="high">High</Badge>
            </View>

            <View style={styles.badgeContainer}>
              <Badge variant="lightning" lightningLevel="none">No Lightning</Badge>
              <Badge variant="lightning" lightningLevel="low">Low</Badge>
              <Badge variant="lightning" lightningLevel="high">High</Badge>
            </View>

            <View style={styles.badgeContainer}>
              <Badge size="sm">Small</Badge>
              <Badge size="md">Medium</Badge>
              <Badge size="lg">Large</Badge>
            </View>
          </View>

          {/* Buttons Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Buttons</Text>
            
            <Button 
              title="Primary Button" 
              onPress={() => Alert.alert('Primary')}
              variant="primary"
              style={{ marginBottom: spacing.sm }}
            />
            
            <Button 
              title="Secondary Button" 
              onPress={() => Alert.alert('Secondary')}
              variant="secondary"
              style={{ marginBottom: spacing.sm }}
            />
            
            <Button 
              title="Outline Button" 
              onPress={() => Alert.alert('Outline')}
              variant="outline"
              style={{ marginBottom: spacing.sm }}
            />

            <View style={styles.buttonRow}>
              <Button 
                title="Small" 
                onPress={() => Alert.alert('Small')}
                size="small"
                style={{ flex: 1, marginRight: spacing.sm }}
              />
              <Button 
                title="Large" 
                onPress={() => Alert.alert('Large')}
                size="large"
                style={{ flex: 1 }}
              />
            </View>
          </View>

          {/* Dropdown Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Dropdown</Text>
            
            <Dropdown
              items={locations}
              selectedValue={selectedLocation}
              onSelect={setSelectedLocation}
              placeholder="Select a location"
              leftIcon={<Ionicons name="navigate" size={24} color={colors.text.primary} />}
            />
          </View>

          {/* Accordion Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Accordion</Text>
            
            <Accordion>
              <AccordionItem
                title="Air Quality Index"
                leftIcon={
                  <View style={[styles.iconBox, { backgroundColor: colors.aqi.good }]}>
                    <Ionicons name="cloud-outline" size={32} color={colors.text.primary} />
                  </View>
                }
                rightContent={<Badge variant="aqi" level="good">45 Good</Badge>}
              >
                <Text style={styles.bodyText}>
                  The AQI is currently at a good level. Air quality is satisfactory and poses little or no risk.
                </Text>
              </AccordionItem>

              <AccordionItem
                title="Pollen Count"
                leftIcon={
                  <View style={[styles.iconBox, { backgroundColor: colors.pollen.medium }]}>
                    <Ionicons name="flower-outline" size={32} color={colors.text.primary} />
                  </View>
                }
                rightContent={<Badge variant="pollen" pollenLevel="medium">3.2 Medium</Badge>}
              >
                <Text style={styles.bodyText}>
                  Current pollen count is at medium levels. Consider limiting outdoor activities if sensitive.
                </Text>
              </AccordionItem>

              <AccordionItem
                title="Weather Effects"
                leftIcon={
                  <View style={[styles.iconBox, { backgroundColor: colors.lightning.low }]}>
                    <Ionicons name="thunderstorm-outline" size={32} color={colors.text.primary} />
                  </View>
                }
                rightContent={<Badge variant="lightning" lightningLevel="low">Low</Badge>}
              >
                <Text style={styles.bodyText}>
                  Minimal storm activity detected. Weather conditions are generally stable.
                </Text>
              </AccordionItem>
            </Accordion>
          </View>

          {/* Charts Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Charts</Text>
            
            <Card variant="transparent">
              <CardTitle>Hourly AQI Chart</CardTitle>
              <HourlyChart hourlyData={hourlyData} />
            </Card>

            <Card variant="transparent">
              <CardTitle>Simple Bar Chart</CardTitle>
              <Chart data={chartData} height={100} />
            </Card>
          </View>

          {/* Input Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Input Fields</Text>
            
            <Input 
              placeholder="Enter location name"
              style={{ marginBottom: spacing.md }}
            />
            
            <Input 
              placeholder="Search locations..."
              leftIcon={<Ionicons name="search" size={20} color={colors.text.muted} />}
              style={{ marginBottom: spacing.md }}
            />
            
            <Input 
              placeholder="Disabled input"
              editable={false}
              value="Cannot edit this"
            />
          </View>

          {/* Typography Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Typography</Text>
            
            <Card>
              <Text style={[typography.h1, { color: colors.text.primary, marginBottom: spacing.sm }]}>
                Heading 1 - Baloo 2 Bold
              </Text>
              <Text style={[typography.h2, { color: colors.text.primary, marginBottom: spacing.sm }]}>
                Heading 2 - Baloo 2 Bold
              </Text>
              <Text style={[typography.h3, { color: colors.text.primary, marginBottom: spacing.sm }]}>
                Heading 3 - Baloo 2 Bold
              </Text>
              <Text style={[typography.body, { color: colors.text.primary, marginBottom: spacing.sm }]}>
                Body text - Nunito Sans Regular. This is the standard body text used throughout the application.
              </Text>
              <Text style={[typography.caption, { color: colors.text.secondary, marginBottom: spacing.sm }]}>
                Caption text - Smaller text for secondary information
              </Text>
              <Text style={[typography.label, { color: colors.text.muted }]}>
                Label text - Extra small text for labels and timestamps
              </Text>
            </Card>
          </View>

          {/* Color Palette Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Color Palette</Text>
            
            <Card>
              <Text style={styles.paletteTitle}>AQI Colors</Text>
              <View style={styles.colorRow}>
                {Object.entries(colors.aqi).map(([key, color]) => (
                  <View key={key} style={styles.colorItem}>
                    <View style={[styles.colorSwatch, { backgroundColor: color }]} />
                    <Text style={styles.colorLabel}>{key}</Text>
                  </View>
                ))}
              </View>

              <Text style={[styles.paletteTitle, { marginTop: spacing.lg }]}>Brand Colors</Text>
              <View style={styles.colorRow}>
                <View style={styles.colorItem}>
                  <View style={[styles.colorSwatch, { backgroundColor: colors.primary }]} />
                  <Text style={styles.colorLabel}>Primary</Text>
                </View>
                <View style={styles.colorItem}>
                  <View style={[styles.colorSwatch, { backgroundColor: colors.secondary }]} />
                  <Text style={styles.colorLabel}>Secondary</Text>
                </View>
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
  scrollContent: {
    paddingHorizontal: spacing.screen.paddingHorizontal,
    paddingTop: spacing.screen.paddingTop,
    paddingBottom: spacing.screen.paddingBottom,
  },
  title: {
    ...typography.h1,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    color: colors.text.secondary,
    marginBottom: spacing.xl,
  },
  section: {
    marginBottom: spacing.xxl,
  },
  sectionTitle: {
    ...typography.h2,
    color: colors.text.primary,
    marginBottom: spacing.base,
  },
  bodyText: {
    ...typography.body,
    color: colors.text.primary,
  },
  badgeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  iconBox: {
    width: 64,
    height: 64,
    borderRadius: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paletteTitle: {
    ...typography.bodyBold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  colorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  colorItem: {
    alignItems: 'center',
  },
  colorSwatch: {
    width: 48,
    height: 48,
    borderRadius: spacing.sm,
    borderWidth: 1,
    borderColor: colors.neutral.gray300,
    marginBottom: spacing.xs,
  },
  colorLabel: {
    ...typography.label,
    color: colors.text.secondary,
  },
});