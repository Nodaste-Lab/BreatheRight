import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Card } from '../../components/ui/Card';
import { fonts } from '../../lib/fonts';
import { useAuthStore } from '../../store/auth';
import { colors } from '@/lib/colors/theme';
import { GradientBackground } from '@/components/ui/GradientBackground';

export default function SettingsScreen() {
  const router = useRouter();
  const { user, profile, signOut } = useAuthStore();
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            router.replace('/(auth)/sign-in');
          },
        },
      ]
    );
  };

  return (
    <GradientBackground>
      <SafeAreaView style={[styles.container, { backgroundColor: 'transparent' }]}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
        </View>

        <View style={styles.content}>
          {/* Profile Section */}
          <Card>
            <Text style={styles.sectionTitle}>Profile</Text>
            <View style={styles.profileInfo}>
              <View style={styles.profileIcon}>
                <Ionicons name="person-circle-outline" size={48} color="#491124" />
              </View>
              <View style={styles.profileText}>
                <Text style={styles.profileName}>{profile?.display_name || 'User'}</Text>
                <Text style={styles.profileEmail}>{user?.email}</Text>
              </View>
            </View>
          </Card>

          {/* Preferences */}
          <Card>
            <Text style={styles.sectionTitle}>Preferences</Text>
            
            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Ionicons name="notifications-outline" size={20} color="#491124" />
                <Text style={styles.settingLabel}>Push Notifications</Text>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: '#d1d5db', true: '#49112466' }}
                thumbColor={notificationsEnabled ? '#491124' : '#f3f4f6'}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Ionicons name="thermometer-outline" size={20} color="#491124" />
                <Text style={styles.settingLabel}>Temperature Unit</Text>
              </View>
              <Text style={styles.settingValue}>°F</Text>
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Ionicons name="speedometer-outline" size={20} color="#491124" />
                <Text style={styles.settingLabel}>Distance Unit</Text>
              </View>
              <Text style={styles.settingValue}>Miles</Text>
            </View>
          </Card>

          {/* About */}
          <Card>
            <Text style={styles.sectionTitle}>About</Text>
            
            <TouchableOpacity style={styles.linkItem}>
              <Ionicons name="information-circle-outline" size={20} color="#491124" />
              <Text style={styles.linkText}>About BreatheRight</Text>
              <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.linkItem}>
              <Ionicons name="document-text-outline" size={20} color="#491124" />
              <Text style={styles.linkText}>Terms of Service</Text>
              <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.linkItem}>
              <Ionicons name="shield-checkmark-outline" size={20} color="#491124" />
              <Text style={styles.linkText}>Privacy Policy</Text>
              <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.linkItem}>
              <Ionicons name="help-circle-outline" size={20} color="#491124" />
              <Text style={styles.linkText}>Help & Support</Text>
              <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
            </TouchableOpacity>
          </Card>

          {/* Account Actions */}
          <Card>
            <TouchableOpacity style={styles.dangerButton} onPress={handleSignOut}>
              <Ionicons name="log-out-outline" size={20} color="#ef4444" />
              <Text style={styles.dangerButtonText}>Sign Out</Text>
            </TouchableOpacity>
          </Card>

          {/* Version Info */}
          <View style={styles.versionInfo}>
            <Text style={styles.versionText}>BreatheRight v1.0.0</Text>
            <Text style={styles.versionSubtext}>Made with ❤️ for cleaner air</Text>
          </View>
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
  },
  content: {
    padding: 16,
  },
  sectionTitle: {
    ...fonts.headline.h5,
    color: '#111827',
    marginBottom: 16,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileIcon: {
    marginRight: 16,
  },
  profileText: {
    flex: 1,
  },
  profileName: {
    ...fonts.headline.h5,
    color: '#111827',
    marginBottom: 2,
  },
  profileEmail: {
    ...fonts.body.small,
    color: '#6b7280',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingLabel: {
    ...fonts.body.regular,
    color: '#111827',
    marginLeft: 12,
  },
  settingValue: {
    ...fonts.body.regular,
    color: '#6b7280',
  },
  linkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  linkText: {
    ...fonts.body.regular,
    color: '#111827',
    marginLeft: 12,
    flex: 1,
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  dangerButtonText: {
    ...fonts.body.regular,
    fontFamily: fonts.weight.semibold,
    color: '#ef4444',
    marginLeft: 8,
  },
  versionInfo: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  versionText: {
    ...fonts.body.small,
    color: '#9ca3af',
    marginBottom: 4,
  },
  versionSubtext: {
    ...fonts.body.tiny,
    color: '#d1d5db',
  },
});