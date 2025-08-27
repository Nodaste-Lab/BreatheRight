import React from 'react';
import { View, Text } from 'react-native';
import type { PollenData } from '../../types/location';

interface PollenCardProps {
  data: PollenData;
}

export function PollenCard({ data }: PollenCardProps) {
  const getPollenColor = (level: number): string => {
    if (level <= 2) return 'bg-green-500';
    if (level <= 4) return 'bg-yellow-500';
    if (level <= 6) return 'bg-orange-500';
    if (level <= 8) return 'bg-red-500';
    return 'bg-red-700';
  };

  const getPollenTextColor = (level: number): string => {
    if (level <= 2) return 'text-green-700';
    if (level <= 4) return 'text-yellow-700';
    if (level <= 6) return 'text-orange-700';
    if (level <= 8) return 'text-red-700';
    return 'text-red-900';
  };

  const formatTime = (timestamp: string): string => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getBarWidth = (value: number): string => {
    return `${Math.min(value * 10, 100)}%`;
  };

  return (
    <View className="bg-white rounded-xl p-6 mb-4 shadow-sm border border-gray-100">
      <View className="flex-row items-center justify-between mb-4">
        <Text className="text-lg font-semibold text-gray-900">Pollen Count</Text>
        <Text className="text-sm text-gray-500">Updated {formatTime(data.timestamp)}</Text>
      </View>

      <View className="flex-row items-center mb-6">
        <View className={`w-16 h-16 rounded-full ${getPollenColor(data.overall)} items-center justify-center mr-4`}>
          <Text className="text-white text-xl font-bold">{data.overall}</Text>
        </View>
        <View>
          <Text className={`text-2xl font-bold ${getPollenTextColor(data.overall)}`}>
            {data.level}
          </Text>
          <Text className="text-gray-600">Pollen Level</Text>
        </View>
      </View>

      <Text className="text-sm font-medium text-gray-900 mb-3">Pollen Breakdown</Text>
      <View className="space-y-3">
        <View>
          <View className="flex-row items-center justify-between mb-1">
            <Text className="text-sm text-gray-600">Tree Pollen</Text>
            <Text className="text-sm font-medium text-gray-900">{data.tree}/10</Text>
          </View>
          <View className="bg-gray-200 h-2 rounded-full">
            <View 
              className={`h-2 rounded-full ${getPollenColor(data.tree)}`}
              style={{ width: getBarWidth(data.tree) }}
            />
          </View>
        </View>

        <View>
          <View className="flex-row items-center justify-between mb-1">
            <Text className="text-sm text-gray-600">Grass Pollen</Text>
            <Text className="text-sm font-medium text-gray-900">{data.grass}/10</Text>
          </View>
          <View className="bg-gray-200 h-2 rounded-full">
            <View 
              className={`h-2 rounded-full ${getPollenColor(data.grass)}`}
              style={{ width: getBarWidth(data.grass) }}
            />
          </View>
        </View>

        <View>
          <View className="flex-row items-center justify-between mb-1">
            <Text className="text-sm text-gray-600">Weed Pollen</Text>
            <Text className="text-sm font-medium text-gray-900">{data.weed}/10</Text>
          </View>
          <View className="bg-gray-200 h-2 rounded-full">
            <View 
              className={`h-2 rounded-full ${getPollenColor(data.weed)}`}
              style={{ width: getBarWidth(data.weed) }}
            />
          </View>
        </View>
      </View>
    </View>
  );
}