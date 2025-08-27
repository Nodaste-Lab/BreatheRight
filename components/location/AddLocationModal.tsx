import React, { useState } from 'react';
import { View, Text, Modal, Alert, ActivityIndicator, StyleSheet, ScrollView } from 'react-native';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useLocationStore } from '../../store/location';

interface AddLocationModalProps {
  visible: boolean;
  onClose: () => void;
  onLocationAdded?: () => void;
}

export function AddLocationModal({ visible, onClose, onLocationAdded }: AddLocationModalProps) {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [isUsingCurrentLocation, setIsUsingCurrentLocation] = useState(false);
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);
  const { createLocation, getUserCurrentLocation, loading } = useLocationStore();

  const handleAddCurrentLocation = async () => {
    try {
      setIsUsingCurrentLocation(true);
      const locationData = await getUserCurrentLocation();
      
      const locationName = name.trim() || 'Current Location';
      await createLocation(
        locationName,
        locationData.latitude,
        locationData.longitude,
        locationData.address
      );
      
      Alert.alert('Success', 'Location added successfully!');
      resetForm();
      onLocationAdded?.();
      onClose();
    } catch (error) {
      Alert.alert(
        'Error', 
        error instanceof Error ? error.message : 'Failed to add location'
      );
    } finally {
      setIsUsingCurrentLocation(false);
    }
  };

  const handleAddByAddress = async () => {
    if (!address.trim()) {
      Alert.alert('Error', 'Please enter an address or location name');
      return;
    }

    try {
      setIsSearchingAddress(true);
      
      // Use a simple geocoding service (OpenStreetMap Nominatim - free)
      const query = encodeURIComponent(address.trim());
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1`
      );
      
      if (!response.ok) {
        throw new Error('Geocoding service unavailable');
      }
      
      const results = await response.json();
      
      if (results.length === 0) {
        Alert.alert('Error', 'Could not find the specified location. Please try a different address.');
        return;
      }

      const location = results[0];
      const locationName = name.trim() || address.trim();
      
      await createLocation(
        locationName,
        parseFloat(location.lat),
        parseFloat(location.lon),
        location.display_name || address.trim()
      );
      
      Alert.alert('Success', 'Location added successfully!');
      resetForm();
      onLocationAdded?.();
      onClose();
    } catch (error) {
      Alert.alert(
        'Error', 
        error instanceof Error ? error.message : 'Failed to add location'
      );
    } finally {
      setIsSearchingAddress(false);
    }
  };

  const resetForm = () => {
    setName('');
    setAddress('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const isDisabled = loading || isUsingCurrentLocation || isSearchingAddress;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.title}>Add Location</Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Location Name (optional)</Text>
              <Input
                value={name}
                onChangeText={setName}
                placeholder="e.g., Home, Work, etc."
                editable={!isDisabled}
              />
            </View>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>Choose one option</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Current Location Option */}
            <View style={styles.optionSection}>
              <Text style={styles.optionTitle}>Use Current Location</Text>
              <Text style={styles.optionDescription}>
                We'll automatically detect your GPS location
              </Text>
              <Button
                title={isUsingCurrentLocation ? "Getting Location..." : "Use Current Location"}
                onPress={handleAddCurrentLocation}
                disabled={isDisabled}
                style={styles.optionButton}
              />
              {isUsingCurrentLocation && (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="#2563EB" />
                  <Text style={styles.loadingText}>Getting your location...</Text>
                </View>
              )}
            </View>

            {/* Manual Address Option */}
            <View style={styles.optionSection}>
              <Text style={styles.optionTitle}>Enter Address or City</Text>
              <Text style={styles.optionDescription}>
                Enter any address, city, or landmark
              </Text>
              <Input
                value={address}
                onChangeText={setAddress}
                placeholder="e.g., New York, NY or 123 Main St"
                editable={!isDisabled}
                style={styles.addressInput}
              />
              <Button
                title={isSearchingAddress ? "Searching..." : "Add Location"}
                onPress={handleAddByAddress}
                disabled={isDisabled || !address.trim()}
                style={styles.optionButton}
              />
              {isSearchingAddress && (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="#2563EB" />
                  <Text style={styles.loadingText}>Searching for location...</Text>
                </View>
              )}
            </View>

            <View style={styles.cancelButtonContainer}>
              <Button
                title="Cancel"
                onPress={handleClose}
                variant="outline"
                disabled={isDisabled}
              />
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '80%',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
    color: '#111827',
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    color: '#374151',
    marginBottom: 8,
    fontSize: 16,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dividerText: {
    marginHorizontal: 16,
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '500',
  },
  optionSection: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
    lineHeight: 20,
  },
  addressInput: {
    marginBottom: 12,
  },
  optionButton: {
    width: '100%',
  },
  cancelButtonContainer: {
    marginTop: 8,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  loadingText: {
    marginLeft: 8,
    color: '#6B7280',
  },
});