import { Tabs, useRouter, useSegments } from 'expo-router';
import React from 'react';
import { Platform, View, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { HapticTab } from '@/components/HapticTab';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { useLocationStore } from '@/store/location';
import { colors } from '@/lib/colors/theme';
import { fonts } from '../../lib/fonts';
import { GradientBackground } from '@/components/ui/GradientBackground';

export default function TabLayout() {
  const burgundyColor = colors.burgundy;
  const activeColor = colors.activeTab;
  const backgroundColor = colors.background;
  const router = useRouter();
  const segments = useSegments();
  const { locations } = useLocationStore();

  return (
    <View style={{ flex: 1, backgroundColor: 'transparent' }}>
      <Tabs
        screenOptions={{
        tabBarActiveTintColor: burgundyColor,
        tabBarInactiveTintColor: `${burgundyColor}`,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: Platform.select({
          ios: {
            // Use a transparent background on iOS to show the blur effect
            position: 'absolute',
            height: 78, // Adjust height if needed
            borderTopWidth: 0, // Remove top border
            backgroundColor: '#F9FEFF',
          },
          default: {
            height: 70, // Adjust height if needed
            borderTopWidth: 0, // Remove top border
            backgroundColor: '#F9FEFF',
            ...fonts.body.small,
          },
        }),
        tabBarLabelPosition: 'below-icon', // Explicitly stack label below icon
        tabBarIconStyle: {
          marginTop: 12, // Add spacing above icon
        },
        tabBarLabelStyle: {
          ...fonts.body.tiny,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Places',
          tabBarIcon: ({ focused }) => (
            <View style={{
              backgroundColor: focused ? `${activeColor}` : 'transparent',
              borderRadius: 16,
              paddingTop: 2,
              marginBottom: 12,
            }}>
              <Image 
                source={require('@/assets/images/tabs/places-icon.png')}
                style={{
                  width: 57,
                  height: 32,
                  tintColor: focused ? burgundyColor : `${burgundyColor}`,
                }}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="forecast"
        options={() => {
          // Check if we're on a location detail page
          const isLocationDetail = segments[1] === 'location' && segments[2];
          
          return {
            title: 'Forecast',
            tabBarIcon: ({ focused }) => {
              const actuallyFocused = focused || isLocationDetail;
              return (
                <View style={{
                  backgroundColor: actuallyFocused ? `${activeColor}` : 'transparent',
                  borderRadius: 16,
                  paddingTop: 2,
                  marginBottom: 12,
                }}>
                  <Image 
                    source={require('@/assets/images/tabs/forecast-icon.png')}
                    style={{
                      width: 57,
                      height: 32,
                      tintColor: actuallyFocused ? burgundyColor : `${burgundyColor}`,
                    }}
                  />
                </View>
              );
            },
            tabBarLabelStyle: {
              color: isLocationDetail ? burgundyColor : undefined,
              ...fonts.body.tiny,
            },
          };
        }}
        listeners={{
          tabPress: (e) => {
            // Prevent default behavior
            e.preventDefault();
            
            // Get primary location or first location
            const primaryLocation = locations.find(loc => loc.show_in_home) || locations[0];
            
            if (primaryLocation) {
              // Navigate directly to the location detail
              router.push(`/location/${primaryLocation.id}`);
            } else {
              // If no locations, go to forecast page which will show empty state
              router.push('/forecast');
            }
          },
        }}
      />
      <Tabs.Screen
        name="alerts"
        options={{
          title: 'Alerts',
          tabBarIcon: ({ focused }) => (
            <View style={{
              backgroundColor: focused ? `${activeColor}` : 'transparent',
              borderRadius: 16,
              paddingTop: 2,
              marginBottom: 12,
            }}>
              <Image 
                source={require('@/assets/images/tabs/alerts-icon.png')}
                style={{
                  width: 57,
                  height: 32,
                  tintColor: focused ? burgundyColor : `${burgundyColor}`,
                }}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ focused }) => (
            <View style={{
              backgroundColor: focused ? `${activeColor}` : 'transparent',
              borderRadius: 16,
              paddingTop: 2,
              marginBottom: 12,
            }}>
              <Image 
                source={require('@/assets/images/tabs/settings-icon.png')}
                style={{
                  width: 57,
                  height: 32,
                  tintColor: focused ? burgundyColor : `${burgundyColor}`,
                }}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="showcase"
        options={{
          title: 'Showcase',
          tabBarIcon: ({ focused }) => (
            <View style={{
              backgroundColor: focused ? `${activeColor}` : 'transparent',
              borderRadius: 16,
              paddingTop: 2,
              marginBottom: 12,
            }}>
              <Ionicons 
                name="library-outline"
                size={28}
                color={focused ? burgundyColor : `${burgundyColor}`}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="location/[id]"
        options={{
          href: null, // Hide from tab bar
          headerShown: false,
        }}
      />
    </Tabs>
    </View>
  );
}
