import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../lib/colors/theme';
import { spacing } from '../../lib/constants/spacing';
import { typography } from '../../lib/constants/typography';
import type { Location } from '../../types/location';
import { useLocationStore } from '../../store/location';

interface EditLocationModalProps {
  visible: boolean;
  location: Location | null;
  onClose: () => void;
}

export function EditLocationModal({ visible, location, onClose }: EditLocationModalProps) {
  const { updateLocation, loading } = useLocationStore();
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');

  // Reset form when location changes
  useEffect(() => {
    if (location) {
      setName(location.name);
      setAddress(location.address);
    }
  }, [location]);

  const handleSave = async () => {
    if (!location) return;

    if (!name.trim()) {
      Alert.alert('Error', 'Location name is required');
      return;
    }

    if (!address.trim()) {
      Alert.alert('Error', 'Address is required');
      return;
    }

    try {
      await updateLocation(location.id, name.trim(), address.trim());
      Alert.alert('Success', 'Location updated successfully');
      onClose();
    } catch (error) {
      Alert.alert('Error', 'Failed to update location');
    }
  };

  const handleCancel = () => {
    // Reset form to original values
    if (location) {
      setName(location.name);
      setAddress(location.address);
    }
    onClose();
  };

  if (!location) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleCancel}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalContainer}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.header}>
              <Text style={styles.title}>Edit Location</Text>
              <TouchableOpacity onPress={handleCancel} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={colors.text.primary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.formContainer}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Name</Text>
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="Enter location name"
                  placeholderTextColor={colors.text.secondary}
                  autoCapitalize="words"
                  editable={!loading}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Address</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={address}
                  onChangeText={setAddress}
                  placeholder="Enter address"
                  placeholderTextColor={colors.text.secondary}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                  editable={!loading}
                />
              </View>

              <View style={styles.coordinatesContainer}>
                <Text style={styles.coordinatesLabel}>Coordinates:</Text>
                <Text style={styles.coordinatesValue}>
                  {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                </Text>
                <Text style={styles.coordinatesNote}>
                  Note: Coordinates cannot be edited. Create a new location if you need different coordinates.
                </Text>
              </View>
            </ScrollView>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={handleCancel}
                disabled={loading}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.saveButton, loading && styles.disabledButton]}
                onPress={handleSave}
                disabled={loading}
              >
                <Text style={styles.saveButtonText}>
                  {loading ? 'Saving...' : 'Save'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.h2,
    color: colors.text.primary,
  },
  closeButton: {
    padding: spacing.xs,
  },
  formContainer: {
    paddingHorizontal: spacing.lg,
  },
  inputGroup: {
    marginBottom: spacing.lg,
  },
  label: {
    ...typography.bodyBold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  input: {
    ...typography.body,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: spacing.base,
    color: colors.text.primary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  textArea: {
    minHeight: 80,
    paddingTop: spacing.base,
  },
  coordinatesContainer: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: spacing.base,
    marginTop: spacing.sm,
  },
  coordinatesLabel: {
    ...typography.caption,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  coordinatesValue: {
    ...typography.bodyBold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  coordinatesNote: {
    ...typography.caption,
    color: colors.text.secondary,
    fontStyle: 'italic',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: spacing.base,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
  },
  button: {
    flex: 1,
    borderRadius: 12,
    padding: spacing.base,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelButtonText: {
    ...typography.bodyBold,
    color: colors.text.primary,
  },
  saveButton: {
    backgroundColor: colors.primary,
  },
  saveButtonText: {
    ...typography.bodyBold,
    color: '#FFFFFF',
  },
  disabledButton: {
    opacity: 0.5,
  },
});
