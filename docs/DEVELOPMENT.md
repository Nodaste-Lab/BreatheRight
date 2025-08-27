# BreathRight Development Guide

## Development Workflow

### Branch Strategy

- `main` - Production-ready code
- `develop` - Integration branch
- `feature/*` - New features
- `fix/*` - Bug fixes

### Commit Convention

Follow conventional commits:
```
feat: add location clustering algorithm
fix: resolve push notification timing
docs: update API integration guide
```

## Code Standards

### TypeScript

```typescript
// Use explicit types
interface Location {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
}

// Avoid 'any' type
const processData = (data: unknown): Location => {
  // Type validation
};
```

### Component Structure

```typescript
// components/AirQualityCard.tsx
import { View, Text } from 'react-native';
import { FC } from 'react';

interface AirQualityCardProps {
  aqi: number;
  location: string;
}

export const AirQualityCard: FC<AirQualityCardProps> = ({ 
  aqi, 
  location 
}) => {
  return (
    <View className="p-4 bg-gray-800 rounded-lg">
      <Text className="text-white">{location}</Text>
      <Text className="text-2xl font-bold text-white">{aqi}</Text>
    </View>
  );
};
```

### State Management

```typescript
// store/useLocationStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface LocationState {
  locations: Location[];
  addLocation: (location: Location) => void;
  removeLocation: (id: string) => void;
}

export const useLocationStore = create<LocationState>()(
  persist(
    (set) => ({
      locations: [],
      addLocation: (location) => 
        set((state) => ({ 
          locations: [...state.locations, location] 
        })),
      removeLocation: (id) =>
        set((state) => ({
          locations: state.locations.filter(l => l.id !== id)
        })),
    }),
    {
      name: 'location-storage',
    }
  )
);
```

## Testing

### Unit Tests

```typescript
// __tests__/utils/clustering.test.ts
import { clusterLocations } from '@/utils/clustering';

describe('clusterLocations', () => {
  it('should group locations within 1km radius', () => {
    const locations = [
      { lat: 40.7128, lng: -74.0060 },
      { lat: 40.7130, lng: -74.0062 },
    ];
    
    const clusters = clusterLocations(locations);
    expect(clusters).toHaveLength(1);
  });
});
```

### Running Tests

```bash
# Unit tests
npm test

# Watch mode
npm test -- --watch

# Coverage
npm test -- --coverage
```

## API Integration

### Caching Strategy

```typescript
// lib/api/cache.ts
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

export const getCachedData = async (key: string) => {
  const cached = await AsyncStorage.getItem(key);
  if (!cached) return null;
  
  const { data, timestamp } = JSON.parse(cached);
  if (Date.now() - timestamp > CACHE_DURATION) {
    return null;
  }
  
  return data;
};
```

### Error Handling

```typescript
// utils/api-error.ts
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Usage
try {
  const data = await fetchAirQuality(location);
} catch (error) {
  if (error instanceof ApiError) {
    // Handle API-specific errors
  }
}
```

## Performance Guidelines

### Image Optimization
- Use WebP format for kawaii characters
- Implement lazy loading for location cards
- Compress images to < 100KB

### API Optimization
- Batch location requests
- Implement request debouncing
- Use location clustering

### Memory Management
- Clean up timers in useEffect
- Unsubscribe from realtime connections
- Limit cached data to 72 hours

## Debugging

### React Native Debugger
```bash
# Install
brew install react-native-debugger

# Use with Expo
# Press 'd' in terminal while running
```

### Network Debugging
- Use Flipper for network inspection
- Check Supabase logs for API issues
- Monitor Google Maps API quotas

## Deployment Checklist

- [ ] Update version in app.json
- [ ] Test on physical devices
- [ ] Check API rate limits
- [ ] Update environment variables
- [ ] Create release notes
- [ ] Tag release in Git