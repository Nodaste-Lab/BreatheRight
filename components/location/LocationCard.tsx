import React from 'react';
import { View, Text, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Location } from '../../types/location';
import { useLocationStore } from '../../store/location';
import { Card } from '../ui/Card';

interface LocationCardProps {
  location: Location;
  onPress: () => void;
  onDelete?: () => void;
}

export function LocationCard({ location, onPress, onDelete }: LocationCardProps) {
  const { setLocationAsPrimary, deleteLocation, loading } = useLocationStore();

  const handleSetPrimary = async () => {
    try {
      await setLocationAsPrimary(location.id);
      Alert.alert('Success', 'Primary location updated!');
    } catch (error) {
      Alert.alert('Error', 'Failed to update primary location');
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Location',
      `Are you sure you want to delete "${location.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteLocation(location.id);
              onDelete?.();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete location');
            }
          },
        },
      ]
    );
  };

  const cardStyle = location.show_in_home ? styles.primaryCard : undefined;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={loading}
    >
      <Card variant="compact" style={cardStyle}>
        <View style={styles.cardContent}>
        <View style={styles.locationInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.locationName}>
              {location.name}
            </Text>
            {location.show_in_home && (
              <View style={styles.primaryBadge}>
                <Text style={styles.primaryBadgeText}>PRIMARY</Text>
              </View>
            )}
          </View>
          <Text style={styles.address}>
            {location.address}
          </Text>
          <Text style={styles.coordinates}>
            {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
          </Text>
        </View>

        <View style={styles.actionButtons}>
          {!location.show_in_home && (
            <TouchableOpacity
              onPress={handleSetPrimary}
              disabled={loading}
              style={styles.actionButton}
              testID="star-button"
            >
              <Ionicons name="star-outline" size={20} color="#6B7280" />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={handleDelete}
            disabled={loading}
            style={styles.actionButton}
            testID="delete-button"
          >
            <Ionicons name="trash-outline" size={20} color="#EF4444" />
          </TouchableOpacity>
        </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  primaryCard: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  locationInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  locationName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  primaryBadge: {
    marginLeft: 8,
    backgroundColor: '#3B82F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  primaryBadgeText: {
    fontSize: 10,
    color: 'white',
    fontWeight: '500',
  },
  address: {
    color: '#6B7280',
    fontSize: 14,
    marginBottom: 8,
  },
  coordinates: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    marginLeft: 12,
  },
  actionButton: {
    padding: 8,
  },
});