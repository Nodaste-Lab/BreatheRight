import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
  Image,
} from 'react-native';
import { useSubscriptionStore, SUBSCRIPTION_PRODUCTS } from '../store/subscription';
import { Button } from './ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { GradientBackground } from './ui/GradientBackground';
import { colors } from '../lib/constants/colors';
import { fonts } from '../lib/fonts';

interface SubscriptionOption {
  id: string;
  name: string;
  price: string;
  period: string;
  description: string;
  savings?: string;
}

const SUBSCRIPTION_OPTIONS: SubscriptionOption[] = [
  {
    id: SUBSCRIPTION_PRODUCTS.monthly,
    name: 'Monthly',
    price: '$0.99',
    period: 'per month',
    description: 'Full access to all features',
  },
  {
    id: SUBSCRIPTION_PRODUCTS.annual,
    name: 'Annual',
    price: '$9.99',
    period: 'per year',
    description: 'Full access to all features',
    savings: 'Save 16%',
  },
];

export function SubscriptionPaywall() {
  const [selectedPlan, setSelectedPlan] = useState<string>(SUBSCRIPTION_PRODUCTS.annual);
  const { initialize, purchaseSubscription, restorePurchases, loading, error } =
    useSubscriptionStore();

  useEffect(() => {
    initialize();
  }, []);

  const handlePurchase = async () => {
    try {
      console.log('=== PURCHASE DEBUG START ===');
      console.log('Selected Plan:', selectedPlan);
      console.log('purchaseSubscription type:', typeof purchaseSubscription);
      console.log('purchaseSubscription:', purchaseSubscription);

      await purchaseSubscription(selectedPlan);

      console.log('=== PURCHASE DEBUG END ===');
    } catch (error) {
      console.error('=== PURCHASE ERROR ===');
      console.error('Error:', error);
      console.error('Error type:', typeof error);
      console.error('Error message:', error instanceof Error ? error.message : String(error));
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
      console.error('=== PURCHASE ERROR END ===');

      Alert.alert(
        'Purchase Failed',
        `${error instanceof Error ? error.message : String(error)}\n\nCheck console for details`
      );
    }
  };

  const handleRestore = async () => {
    try {
      await restorePurchases();
      Alert.alert('Success', 'Purchases restored successfully');
    } catch (error) {
      Alert.alert(
        'Restore Failed',
        error instanceof Error ? error.message : 'Failed to restore purchases'
      );
    }
  };

  const openPrivacyPolicy = () => {
    Linking.openURL('https://www.nodaste.com/aqbuddy/privacy-policy');
  };

  const openTerms = () => {
    Linking.openURL('https://www.nodaste.com/aqbuddy/terms-of-service');
  };

  return (
    <GradientBackground>
      <View style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Try AQBuddy for Free!</Text>
            <Text style={styles.subtitle}>
              Get unlimited access to real-time air quality (AQI), pollen, weather, and pollution alerts tailored to your health needs and daily routine.
            </Text>

            <View style={styles.lungsContainer}>
              <Image
                source={require('../assets/kawaii/lungs-good.png')}
                style={styles.lungsImage}
                resizeMode="contain"
              />
              <View style={styles.featuresBox}>
                <FeatureItem text="Real-time AQI, pollen, and weather alerts" />
                <FeatureItem text="Track multiple locations like home, school, or work" />
                <FeatureItem text="Health-based tips and alerts customized to your needs" />
                <FeatureItem text="Friendly kawaii characters make complex data simple and fun" />
                <FeatureItem text="Simple, uncluttered user interface" />
              </View>
            </View>
          </View>

        <View style={styles.plans}>
          {SUBSCRIPTION_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.planCard,
                selectedPlan === option.id && styles.planCardSelected,
              ]}
              onPress={() => setSelectedPlan(option.id)}
              activeOpacity={0.7}
            >
              {option.savings && (
                <View style={styles.savingsBadge}>
                  <Text style={styles.savingsText}>{option.savings}</Text>
                </View>
              )}

              <View style={styles.planHeader}>
                <View style={styles.radioButton}>
                  {selectedPlan === option.id && <View style={styles.radioButtonInner} />}
                </View>
                <Text style={styles.planName}>{option.name}</Text>
              </View>

              <View style={styles.planPricing}>
                <Text style={styles.planPrice}>{option.price}</Text>
                <Text style={styles.planPeriod}>{option.period}</Text>
              </View>

              <Text style={styles.planDescription}>{option.description}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.actions}>
          <Button
            title={loading ? 'Processing...' : 'Start 7-Day Free Trial'}
            variant="primary"
            size="lg"
            fullWidth
            loading={loading}
            onPress={handlePurchase}
          />

          <TouchableOpacity
            style={styles.restoreButton}
            onPress={handleRestore}
            disabled={loading}
          >
            <Text style={styles.restoreText}>Restore Purchases</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerTagline}>
            Stay ahead of pollution, protect your loved ones, and enjoy the outdoors—safely.
          </Text>

          <Text style={styles.footerText}>
            Subscriptions will automatically renew unless cancelled at least 24 hours before the end
            of the current period.
          </Text>

          <View style={styles.legalLinks}>
            <TouchableOpacity onPress={openPrivacyPolicy}>
              <Text style={styles.legalLinkText}>Privacy Policy</Text>
            </TouchableOpacity>
            <Text style={styles.legalSeparator}>•</Text>
            <TouchableOpacity onPress={openTerms}>
              <Text style={styles.legalLinkText}>Terms of Service</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
      </View>
    </GradientBackground>
  );
}

function FeatureItem({ text }: { text: string }) {
  return (
    <View style={styles.featureItem}>
      <View style={styles.checkmark}>
        <Text style={styles.checkmarkText}>✓</Text>
      </View>
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 66,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
  },
  header: {
    marginBottom: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontFamily: fonts.weight.bold,
    color: '#491124',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    fontFamily: fonts.weight.regular,
    color: '#374151',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 2,
    paddingHorizontal: 8,
  },
  lungsContainer: {
    width: '100%',
    alignItems: 'center',
    position: 'relative',
  },
  lungsImage: {
    width: 200,
    height: 200,
    zIndex: 10,
    marginBottom: -60,
  },
  featuresBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    width: '100%',
    borderWidth: 2,
    borderColor: '#B8DCE8',
  },
  features: {
    marginBottom: 32,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  checkmark: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#491124',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  checkmarkText: {
    color: colors.neutral.white,
    fontSize: 14,
    fontFamily: fonts.weight.bold,
  },
  featureText: {
    fontSize: 15,
    fontFamily: fonts.weight.regular,
    color: '#1F2937',
    flex: 1,
    lineHeight: 22,
  },
  plans: {
    marginBottom: 24,
  },
  planCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  planCardSelected: {
    borderColor: '#491124',
    backgroundColor: '#FFF5F7',
    borderWidth: 3,
  },
  savingsBadge: {
    position: 'absolute',
    top: -10,
    right: 20,
    backgroundColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  savingsText: {
    color: colors.neutral.white,
    fontSize: 12,
    fontFamily: fonts.weight.bold,
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#491124',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#491124',
  },
  planName: {
    fontSize: 20,
    fontFamily: fonts.weight.semibold,
    color: colors.text.primary,
  },
  planPricing: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  planPrice: {
    fontSize: 28,
    fontFamily: fonts.weight.bold,
    color: colors.text.primary,
    marginRight: 8,
  },
  planPeriod: {
    fontSize: 16,
    fontFamily: fonts.weight.regular,
    color: colors.text.secondary,
  },
  planDescription: {
    fontSize: 14,
    fontFamily: fonts.weight.regular,
    color: colors.text.secondary,
  },
  errorContainer: {
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  errorText: {
    color: colors.semantic.error,
    fontSize: 14,
    fontFamily: fonts.weight.regular,
    textAlign: 'center',
  },
  actions: {
    marginBottom: 24,
  },
  restoreButton: {
    marginTop: 16,
    alignItems: 'center',
    padding: 12,
  },
  restoreText: {
    fontSize: 16,
    fontFamily: fonts.weight.semibold,
    color: '#491124',
  },
  footer: {
    paddingTop: 20,
    paddingBottom: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  footerTagline: {
    fontSize: 14,
    fontFamily: fonts.weight.semibold,
    color: colors.text.primary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 12,
  },
  footerText: {
    fontSize: 12,
    fontFamily: fonts.weight.regular,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  legalLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  legalLinkText: {
    fontSize: 12,
    fontFamily: fonts.weight.regular,
    color: '#491124',
    textDecorationLine: 'underline',
  },
  legalSeparator: {
    fontSize: 12,
    color: colors.text.secondary,
    marginHorizontal: 8,
  },
});
