import React from 'react';
import { View, Text } from 'react-native';
import type { AQIData } from '../../types/location';

interface AQICardProps {
  data: AQIData;
}

export function AQICard({ data }: AQICardProps) {
  const getAQIColor = (aqi: number): string => {
    if (aqi <= 50) return 'bg-green-500';
    if (aqi <= 100) return 'bg-yellow-500';
    if (aqi <= 150) return 'bg-orange-500';
    if (aqi <= 200) return 'bg-red-500';
    if (aqi <= 300) return 'bg-purple-500';
    return 'bg-red-900';
  };

  const getAQITextColor = (aqi: number): string => {
    if (aqi <= 50) return 'text-green-700';
    if (aqi <= 100) return 'text-yellow-700';
    if (aqi <= 150) return 'text-orange-700';
    if (aqi <= 200) return 'text-red-700';
    if (aqi <= 300) return 'text-purple-700';
    return 'text-red-900';
  };

  const formatTime = (timestamp: string): string => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <View className="bg-white rounded-xl p-6 mb-4 shadow-sm border border-gray-100">
      <View className="flex-row items-center justify-between mb-4">
        <Text className="text-lg font-semibold text-gray-900">Air Quality Index</Text>
        <Text className="text-sm text-gray-500">Updated {formatTime(data.timestamp)}</Text>
      </View>

      <View className="flex-row items-center mb-6">
        <View className={`w-16 h-16 rounded-full ${getAQIColor(data.aqi)} items-center justify-center mr-4`}>
          <Text className="text-white text-xl font-bold">{data.aqi}</Text>
        </View>
        <View>
          <Text className={`text-2xl font-bold ${getAQITextColor(data.aqi)}`}>
            {data.level}
          </Text>
          <Text className="text-gray-600">AQI Level</Text>
        </View>
      </View>

      <Text className="text-sm font-medium text-gray-900 mb-3">Pollutant Breakdown</Text>
      <View className="grid grid-cols-2 gap-3">
        <View className="bg-gray-50 p-3 rounded-lg">
          <Text className="text-xs text-gray-600 mb-1">PM2.5</Text>
          <Text className="text-lg font-semibold text-gray-900">{data.pollutants.pm25} µg/m³</Text>
        </View>
        <View className="bg-gray-50 p-3 rounded-lg">
          <Text className="text-xs text-gray-600 mb-1">PM10</Text>
          <Text className="text-lg font-semibold text-gray-900">{data.pollutants.pm10} µg/m³</Text>
        </View>
        <View className="bg-gray-50 p-3 rounded-lg">
          <Text className="text-xs text-gray-600 mb-1">Ozone</Text>
          <Text className="text-lg font-semibold text-gray-900">{data.pollutants.o3} µg/m³</Text>
        </View>
        <View className="bg-gray-50 p-3 rounded-lg">
          <Text className="text-xs text-gray-600 mb-1">NO2</Text>
          <Text className="text-lg font-semibold text-gray-900">{data.pollutants.no2} µg/m³</Text>
        </View>
      </View>
    </View>
  );
}