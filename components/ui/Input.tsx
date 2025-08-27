import React from 'react';
import { TextInput, Text, View, type TextInputProps } from 'react-native';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  required?: boolean;
}

export function Input({ 
  label, 
  error, 
  required, 
  className = '',
  ...props 
}: InputProps) {
  return (
    <View className="mb-4">
      {label && (
        <Text className="text-gray-700 dark:text-gray-300 mb-2 font-medium">
          {label}
          {required && <Text className="text-red-500 ml-1">*</Text>}
        </Text>
      )}
      <TextInput
        className={`
          border border-gray-300 dark:border-gray-600 
          rounded-lg px-4 py-3 
          bg-white dark:bg-gray-800 
          text-gray-900 dark:text-gray-100
          ${error ? 'border-red-500' : 'focus:border-blue-500'}
          ${className}
        `}
        placeholderTextColor="#9CA3AF"
        {...props}
      />
      {error && (
        <Text className="text-red-500 text-sm mt-1">{error}</Text>
      )}
    </View>
  );
}