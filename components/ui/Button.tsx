import React from 'react';
import { 
  TouchableOpacity, 
  Text, 
  ActivityIndicator, 
  StyleSheet,
  type TouchableOpacityProps,
  type ViewStyle,
  type TextStyle
} from 'react-native';
import { colors } from '../../lib/constants/colors';
import { fonts } from '../../lib/fonts';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  fullWidth?: boolean;
}

export function Button({ 
  title, 
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  disabled,
  style,
  ...props 
}: ButtonProps) {
  
  // Compose button styles
  const buttonStyles: ViewStyle[] = [
    styles.base,
    (styles.size as any)[size],
    (styles.variant as any)[variant],
    fullWidth && styles.fullWidth,
    (disabled || loading) && styles.disabled,
    style as ViewStyle,
  ].filter(Boolean) as ViewStyle[];

  // Compose text styles
  const textStyleArray: TextStyle[] = [
    (styles.text as any).base,
    (styles.text as any)[variant],
  ].filter(Boolean) as TextStyle[];

  return (
    <TouchableOpacity
      style={buttonStyles}
      disabled={disabled || loading}
      activeOpacity={0.7}
      {...props}
    >
      {loading && (
        <ActivityIndicator 
          size="small" 
          color={variant === 'outline' || variant === 'ghost' ? colors.primary : colors.neutral.white} 
          style={styles.loader}
        />
      )}
      <Text style={textStyleArray}>
        {title}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  size: {
    sm: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      minHeight: 32,
    },
    md: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      minHeight: 44,
    },
    lg: {
      paddingHorizontal: 24,
      paddingVertical: 16,
      minHeight: 56,
    },
  },
  
  variant: {
    primary: {
      backgroundColor: colors.primary,
    },
    secondary: {
      backgroundColor: colors.neutral.white,
      borderWidth: 1,
      borderColor: colors.neutral.gray400,
    },
    outline: {
      backgroundColor: 'transparent',
      borderWidth: 2,
      borderColor: colors.semantic.info,
    },
    ghost: {
      backgroundColor: 'transparent',
    },
  },
  
  fullWidth: {
    width: '100%',
  },
  
  disabled: {
    opacity: 0.5,
  },
  
  loader: {
    marginRight: 8,
  },
  
  text: {
    base: {
      fontSize: 16,
      textAlign: 'center',
      fontFamily: fonts.weight.semibold, // Using Nunito Sans for all button text
    },
    primary: {
      color: colors.neutral.white,
      fontWeight: '100',
    },
    secondary: {
      color: colors.primary,
      fontWeight: '100',
    },
    outline: {
      color: colors.primary,
      fontWeight: '100',
    },
    ghost: {
      color: colors.neutral.gray700,
      fontWeight: '500',
    },
  },
});