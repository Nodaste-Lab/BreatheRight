import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  LayoutAnimation,
  Platform,
  UIManager,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, radius, borders } from '../../lib/constants';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface AccordionItemProps {
  title: string;
  children: React.ReactNode;
  isExpanded?: boolean;
  onToggle?: () => void;
  leftIcon?: React.ReactNode;
  rightContent?: React.ReactNode;
  style?: ViewStyle;
}

export function AccordionItem({
  title,
  children,
  isExpanded = false,
  onToggle,
  leftIcon,
  rightContent,
  style,
}: AccordionItemProps) {
  const [expanded, setExpanded] = useState(isExpanded);
  const isControlled = onToggle !== undefined;
  const actualExpanded = isControlled ? isExpanded : expanded;

  const handlePress = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    if (isControlled) {
      onToggle?.();
    } else {
      setExpanded(!expanded);
    }
  };

  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity
        style={styles.header}
        onPress={handlePress}
        activeOpacity={0.7}
      >
        <View style={styles.headerLeft}>
          {leftIcon && <View style={styles.iconContainer}>{leftIcon}</View>}
          <Text style={styles.title}>{title}</Text>
        </View>
        <View style={styles.headerRight}>
          {rightContent}
          <Ionicons
            name={actualExpanded ? 'chevron-up' : 'chevron-down'}
            size={20}
            color={colors.text.primary}
          />
        </View>
      </TouchableOpacity>
      {actualExpanded && (
        <View style={styles.content}>
          {children}
        </View>
      )}
    </View>
  );
}

interface AccordionProps {
  children: React.ReactNode;
  style?: ViewStyle;
  allowMultiple?: boolean;
}

export function Accordion({ children, style, allowMultiple = false }: AccordionProps) {
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());

  const handleItemToggle = (index: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        if (!allowMultiple) {
          newSet.clear();
        }
        newSet.add(index);
      }
      return newSet;
    });
  };

  return (
    <View style={[styles.accordionContainer, style]}>
      {React.Children.map(children, (child, index) => {
        if (React.isValidElement(child) && child.type === AccordionItem) {
          return React.cloneElement(child as React.ReactElement<AccordionItemProps>, {
            isExpanded: expandedItems.has(index),
            onToggle: () => handleItemToggle(index),
          });
        }
        return child;
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  accordionContainer: {
    gap: spacing.md,
  },
  container: {
    backgroundColor: colors.neutral.whiteAlpha65,
    borderRadius: radius.accordion,
    borderWidth: borders.accordion,
    borderColor: colors.neutral.white,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.accordion.paddingHorizontal,
    paddingVertical: spacing.accordion.paddingVertical,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing.accordion.gap,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: radius.md,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...typography.h2,
    color: colors.text.primary,
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.accordion.paddingHorizontal,
    paddingBottom: spacing.accordion.paddingVertical,
  },
});