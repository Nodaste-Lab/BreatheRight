import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  StyleSheet,
  ViewStyle,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, radius, shadows } from '../../lib/constants';

interface DropdownItem {
  label: string;
  value: string | number;
  sublabel?: string;
}

interface DropdownProps {
  items: DropdownItem[];
  selectedValue?: string | number;
  onSelect: (value: string | number) => void;
  placeholder?: string;
  label?: string;
  leftIcon?: React.ReactNode;
  style?: ViewStyle;
}

export function Dropdown({
  items,
  selectedValue,
  onSelect,
  placeholder = 'Select an option',
  label,
  leftIcon,
  style,
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedItem = items.find(item => item.value === selectedValue);

  const handleSelect = (value: string | number) => {
    onSelect(value);
    setIsOpen(false);
  };

  return (
    <>
      <TouchableOpacity
        style={[styles.trigger, style]}
        onPress={() => setIsOpen(true)}
        activeOpacity={0.7}
      >
        <View style={styles.triggerContent}>
          {leftIcon && <View style={styles.iconContainer}>{leftIcon}</View>}
          <View style={styles.textContainer}>
            {label && <Text style={styles.label}>{label}</Text>}
            <Text style={[styles.value, !selectedItem && styles.placeholder]}>
              {selectedItem?.label || placeholder}
            </Text>
            {selectedItem?.sublabel && (
              <Text style={styles.sublabel}>{selectedItem.sublabel}</Text>
            )}
          </View>
        </View>
        <Ionicons 
          name="chevron-down" 
          size={24} 
          color={colors.text.primary} 
        />
      </TouchableOpacity>

      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <Pressable 
          style={styles.overlay}
          onPress={() => setIsOpen(false)}
        >
          <View style={styles.dropdownContainer}>
            <ScrollView 
              style={styles.scrollView}
              showsVerticalScrollIndicator={false}
              bounces={false}
            >
              {items.map((item, index) => {
                const isSelected = item.value === selectedValue;
                return (
                  <TouchableOpacity
                    key={`${item.value}-${index}`}
                    style={[
                      styles.item,
                      isSelected && styles.selectedItem,
                      index > 0 && styles.itemBorder,
                    ]}
                    onPress={() => handleSelect(item.value)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.itemContent}>
                      <Text style={[styles.itemLabel, isSelected && styles.selectedItemText]}>
                        {item.label}
                      </Text>
                      {item.sublabel && (
                        <Text style={[styles.itemSublabel, isSelected && styles.selectedItemText]}>
                          {item.sublabel}
                        </Text>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    backgroundColor: colors.neutral.white,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.neutral.white,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...shadows.sm,
  },
  triggerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing.sm,
  },
  iconContainer: {
    width: 24,
    height: 24,
  },
  textContainer: {
    flex: 1,
  },
  label: {
    ...typography.h2,
    color: colors.text.primary,
  },
  value: {
    ...typography.body,
    color: colors.text.primary,
  },
  placeholder: {
    color: colors.text.muted,
  },
  sublabel: {
    ...typography.label,
    color: colors.text.primary,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    paddingHorizontal: spacing.base,
  },
  dropdownContainer: {
    backgroundColor: colors.neutral.white,
    borderRadius: radius.dropdown,
    maxHeight: 400,
    ...shadows.dropdown,
  },
  scrollView: {
    padding: spacing.md,
  },
  item: {
    paddingVertical: spacing.dropdown.itemPadding,
    paddingHorizontal: spacing.xs,
  },
  itemBorder: {
    borderTopWidth: 1,
    borderTopColor: colors.neutral.blackAlpha20,
  },
  selectedItem: {
    backgroundColor: colors.ui.activeBackground,
    marginHorizontal: -spacing.md,
    paddingHorizontal: spacing.dropdown.itemPadding,
  },
  itemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemLabel: {
    ...typography.h2,
    color: colors.text.primary,
  },
  itemSublabel: {
    ...typography.label,
    color: colors.text.primary,
  },
  selectedItemText: {
    color: colors.text.primary,
  },
});