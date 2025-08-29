import React from 'react';
import { Text as RNText, type TextProps as RNTextProps, StyleSheet } from 'react-native';
import { fonts } from '../../lib/fonts';

interface AppTextProps extends RNTextProps {
  variant?: 'regular' | 'small' | 'tiny' | 'large';
  weight?: 'light' | 'regular' | 'semibold' | 'bold';
}

/**
 * Custom Text component that ensures Nunito Sans is used by default
 * Use this instead of React Native's Text component
 */
export function AppText({ 
  style, 
  variant = 'regular',
  weight = 'regular',
  children,
  ...props 
}: AppTextProps) {
  
  const textStyles = [
    styles.base,
    variantStyles[variant],
    { fontFamily: fonts.weight[weight] },
    style,
  ];

  return (
    <RNText style={textStyles} {...props}>
      {children}
    </RNText>
  );
}

const styles = StyleSheet.create({
  base: {
    fontFamily: fonts.weight.regular, // Default to Nunito Sans Regular
    color: '#1E1E1E', // Default text color
  },
});

const variantStyles = {
  large: {
    fontSize: 18,
    lineHeight: 26,
  },
  regular: {
    fontSize: 16,
    lineHeight: 24,
  },
  small: {
    fontSize: 14,
    lineHeight: 20,
  },
  tiny: {
    fontSize: 12,
    lineHeight: 16,
  },
};