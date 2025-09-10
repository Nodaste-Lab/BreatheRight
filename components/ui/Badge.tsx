import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { colors, typography, spacing, borders, radius } from '../../lib/constants';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'aqi' | 'pollen' | 'lightning' | 'default';
  level?: 'good' | 'moderate' | 'poor' | 'unhealthy' | 'veryUnhealthy' | 'hazardous';
  pollenLevel?: 'low' | 'medium' | 'high' | 'veryHigh';
  lightningLevel?: 'none' | 'low' | 'medium' | 'high';
  size?: 'sm' | 'md' | 'lg';
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Badge({ 
  children, 
  variant = 'default',
  level,
  pollenLevel,
  lightningLevel,
  size = 'md',
  style,
  textStyle
}: BadgeProps) {
  const getBackgroundColor = () => {
    if (variant === 'aqi' && level) {
      return colors.aqi[level];
    }
    if (variant === 'pollen' && pollenLevel) {
      return colors.pollen[pollenLevel === 'veryHigh' ? 'veryHigh' : pollenLevel];
    }
    if (variant === 'lightning' && lightningLevel) {
      return colors.lightning[lightningLevel];
    }
    return colors.neutral.gray100;
  };

  const getSizeStyles = (): ViewStyle => {
    switch (size) {
      case 'sm':
        return {
          paddingHorizontal: spacing.sm,
          paddingVertical: spacing.xs,
          minHeight: 32,
          height: 32,
        };
      case 'lg':
        return {
          paddingHorizontal: spacing.base,
          paddingVertical: spacing.sm,
          minHeight: 44,
          height: 44,
        };
      case 'md':
      default:
        return {
          paddingHorizontal: spacing.badge.paddingHorizontal,
          paddingVertical: spacing.xs,
          minHeight: 40,
          height: 40,
        };
    }
  };

  const getTextSize = (): TextStyle => {
    switch (size) {
      case 'sm':
        return typography.caption;
      case 'lg':
        return typography.body;
      case 'md':
      default:
        return typography.badgeLabel;
    }
  };

  const backgroundColor = getBackgroundColor();

  return (
    <View
      style={[
        styles.badge,
        getSizeStyles(),
        { 
          backgroundColor,
          borderColor: backgroundColor,
        },
        style,
      ]}
    >
      {typeof children === 'string' ? (
        <Text style={[styles.text, getTextSize(), textStyle]}>
          {children}
        </Text>
      ) : (
        children
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.badge,
    borderWidth: borders.badge,
    gap: 0,
    flexShrink: 0,
    flexWrap: 'nowrap',
    overflow: 'hidden',
  },
  text: {
    color: colors.contrastText.primary,
    textAlign: 'center',
    lineHeight: undefined,
  },
});