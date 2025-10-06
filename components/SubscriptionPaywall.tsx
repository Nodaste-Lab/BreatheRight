import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSubscriptionStore, SUBSCRIPTION_PRODUCTS } from '../store/subscription';
import { Button } from './ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
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
    price: '$2.99',
    period: 'per month',
    description: 'Full access to all features',
  },
  {
    id: SUBSCRIPTION_PRODUCTS.annual,
    name: 'Annual',
    price: '$29.99',
    period: 'per year',
    description: 'Full access to all features',
    savings: 'Save 17%',
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

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Subscribe to AQ Buddy</Text>
          <Text style={styles.subtitle}>
            Get unlimited access to real-time air quality monitoring and health recommendations
          </Text>
        </View>

        <View style={styles.features}>
          <FeatureItem text="Real-time air quality monitoring" />
          <FeatureItem text="Personalized health recommendations" />
          <FeatureItem text="Location-based alerts" />
          <FeatureItem text="7-day air quality forecast" />
          <FeatureItem text="Historical data tracking" />
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
            title={loading ? 'Processing...' : 'Subscribe Now'}
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
          <Text style={styles.footerText}>
            Subscriptions will automatically renew unless cancelled at least 24 hours before the end
            of the current period.
          </Text>
        </View>
      </ScrollView>
    </View>
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
    backgroundColor: colors.neutral.white,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
  },
  header: {
    marginBottom: 32,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontFamily: fonts.weight.bold,
    color: colors.text.primary,
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    fontFamily: fonts.weight.regular,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  features: {
    marginBottom: 32,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkmarkText: {
    color: colors.neutral.white,
    fontSize: 16,
    fontFamily: fonts.weight.bold,
  },
  featureText: {
    fontSize: 16,
    fontFamily: fonts.weight.regular,
    color: colors.text.primary,
    flex: 1,
  },
  plans: {
    marginBottom: 24,
  },
  planCard: {
    backgroundColor: colors.neutral.white,
    borderWidth: 2,
    borderColor: colors.neutral.gray300,
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    position: 'relative',
  },
  planCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.neutral.whiteAlpha65,
  },
  savingsBadge: {
    position: 'absolute',
    top: -10,
    right: 20,
    backgroundColor: colors.semantic.success,
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
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
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
    backgroundColor: colors.semantic.error + '20',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
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
    color: colors.primary,
  },
  footer: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.neutral.gray300,
  },
  footerText: {
    fontSize: 12,
    fontFamily: fonts.weight.regular,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 18,
  },
});
