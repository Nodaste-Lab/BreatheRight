import React from 'react';
import { StyleSheet, ImageBackground, View } from 'react-native';
import { colors as themeColors } from '@/lib/colors/theme';

interface GradientBackgroundProps {
  children: React.ReactNode;
  theme?: 'light' | 'dark';
}

export function GradientBackground({ children, theme = 'light' }: GradientBackgroundProps) {
  return (
    <View style={[styles.container, { backgroundColor: '#D6F0FD' }]}>
      <ImageBackground
        source={require('@/assets/images/background.png')}
        style={styles.gradient}
        resizeMode="contain"
        imageStyle={styles.backgroundImage}
      >
        {children}
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradient: {
    flex: 1,
    width: '100%',
  },
  backgroundImage: {
    // Image will be centered by the resizeMode="contain"
  },
});