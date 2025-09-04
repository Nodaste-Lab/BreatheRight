import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { colors, typography, spacing, radius, borders, shadows } from '../../lib/constants';

interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'transparent' | 'filled' | 'outlined' | 'compact' | 'elevated';
  style?: ViewStyle;
}

export function Card({ children, variant = 'default', style }: CardProps) {
  const containerStyle = [
    styles.base,
    styles[variant],
    style,
  ];

  return <View style={containerStyle}>{children}</View>;
}

interface CardHeaderProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export function CardHeader({ children, style }: CardHeaderProps) {
  return (
    <View style={[styles.header, style]}>
      {children}
    </View>
  );
}

interface CardTitleProps {
  children: React.ReactNode;
  style?: TextStyle;
}

export function CardTitle({ children, style }: CardTitleProps) {
  return (
    <Text style={[styles.title, style]}>
      {children}
    </Text>
  );
}

interface CardContentProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export function CardContent({ children, style }: CardContentProps) {
  return (
    <View style={[styles.content, style]}>
      {children}
    </View>
  );
}

interface CardFooterProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export function CardFooter({ children, style }: CardFooterProps) {
  return (
    <View style={[styles.footer, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: spacing.card.borderRadius,
    padding: spacing.card.padding,
    marginBottom: spacing.base,
  },
  default: {
    backgroundColor: colors.neutral.whiteAlpha65,
    borderWidth: borders.card,
    borderColor: colors.neutral.white,
  },
  transparent: {
    backgroundColor: colors.neutral.whiteAlpha65,
  },
  filled: {
    backgroundColor: colors.neutral.white,
    ...shadows.card,
  },
  outlined: {
    backgroundColor: colors.neutral.white,
    borderWidth: borders.card,
    borderColor: colors.neutral.gray300,
  },
  compact: {
    backgroundColor: colors.neutral.whiteAlpha65,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  elevated: {
    backgroundColor: colors.neutral.whiteAlpha65,
    ...shadows.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  title: {
    ...typography.h2,
    color: colors.text.primary,
  },
  content: {
    gap: spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.neutral.blackAlpha20,
  },
});