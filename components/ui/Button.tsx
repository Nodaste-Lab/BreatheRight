import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, type TouchableOpacityProps } from 'react-native';

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
  className = '',
  ...props 
}: ButtonProps) {
  const baseStyles = 'rounded-lg flex-row items-center justify-center';
  
  const sizeStyles = {
    sm: 'px-3 py-2',
    md: 'px-4 py-3',
    lg: 'px-6 py-4',
  };
  
  const variantStyles = {
    primary: 'bg-blue-600 active:bg-blue-700',
    secondary: 'bg-gray-600 active:bg-gray-700',
    outline: 'border-2 border-blue-600 bg-transparent active:bg-blue-50',
    ghost: 'bg-transparent active:bg-gray-100',
  };
  
  const textStyles = {
    primary: 'text-white font-semibold',
    secondary: 'text-white font-semibold',
    outline: 'text-blue-600 font-semibold',
    ghost: 'text-gray-700 font-medium',
  };
  
  const disabledStyles = disabled || loading ? 'opacity-50' : '';
  const widthStyles = fullWidth ? 'w-full' : '';
  
  return (
    <TouchableOpacity
      className={`
        ${baseStyles}
        ${sizeStyles[size]}
        ${variantStyles[variant]}
        ${disabledStyles}
        ${widthStyles}
        ${className}
      `}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <ActivityIndicator 
          size="small" 
          color={variant === 'outline' || variant === 'ghost' ? '#2563EB' : '#FFFFFF'} 
          className="mr-2" 
        />
      )}
      <Text className={textStyles[variant]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
}