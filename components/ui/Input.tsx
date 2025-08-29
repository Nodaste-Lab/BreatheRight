import React from 'react';
import { TextInput, Text, View, StyleSheet, type TextInputProps } from 'react-native';
import { fonts } from '../../lib/fonts';

interface InputProps extends TextInputProps {
  label?: string;
  description?: string;
  error?: string;
  required?: boolean;
}

export function Input({ 
  label, 
  description,
  error, 
  required, 
  style,
  ...props 
}: InputProps) {
  return (
    <View style={styles.container}>
      {label && (
        <Text style={styles.label}>
          {label}
          {required && <Text style={styles.required}>*</Text>}
        </Text>
      )}
      
      {description && (
        <Text style={styles.description}>{description}</Text>
      )}
      
      <TextInput
        style={[
          styles.input, 
          error && styles.inputError,
          style
        ]}
        placeholderTextColor="#9CA3AF"
        {...props}
      />
      
      {error && (
        <Text style={styles.error}>{error}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  // Main container with auto layout
  container: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    padding: 0,
    gap: 8,
    alignSelf: 'stretch',
    marginBottom: 16,
  },
  
  // Label styles
  label: {
    alignSelf: 'stretch',
    fontFamily: fonts.weight.regular,
    fontSize: 16,
    lineHeight: 22,
    color: '#491124',
  },
  
  required: {
    color: '#EF4444',
  },
  
  // Description styles
  description: {
    alignSelf: 'stretch',
    fontFamily: fonts.weight.regular,
    fontSize: 14,
    lineHeight: 20,
    color: '#653C4A',
  },
  
  // Input field styles
  input: {
    fontFamily: fonts.weight.regular,
    fontSize: 16,
    color: '#1E1E1E',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D9D9D9',
    paddingHorizontal: 16,
    paddingVertical: 12,
    width: '100%', // Full width
    minHeight: 48, // Consistent height
  },
  
  // Error state for input
  inputError: {
    borderColor: '#EF4444',
    borderWidth: 1,
  },
  
  // Error text styles (initially hidden)
  error: {
    fontFamily: fonts.weight.regular,
    fontStyle: 'normal',
    fontWeight: '400',
    fontSize: 16,
    lineHeight: 22, // 140% of 16px
    color: '#EF4444',
    flexGrow: 0,
  },
});