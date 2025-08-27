# BreathRight Mobile App - Technical Specification

## 1. Overview

**Product**: BreathRight - Mobile-first air quality management app  
**Platform**: React Native with Expo (iOS 14+ and Android 10+)  
**Backend**: Supabase (PostgreSQL, Auth, Edge Functions, Realtime)  
**Target**: MVP with 3-location profile support

## 2. Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Mobile App (Expo)                     │
├─────────────────────────────────────────────────────────┤
│  UI Layer      │  State Layer   │   Service Layer       │
│  - NativeWind  │  - Zustand      │   - API Clients       │
│  - Components  │  - Local Cache  │   - Push Service      │
└────────────────┴────────────────┴───────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                  Supabase Backend                        │
├─────────────────────────────────────────────────────────┤
│  Edge Functions │  PostgreSQL    │   Realtime           │
│  - API Proxy    │  - User Data   │   - Notifications    │
│  - Caching      │  - Locations   │   - Updates          │
└─────────────────┴────────────────┴───────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│              External APIs (Google Maps Platform)        │
├─────────────────────────────────────────────────────────┤
│  Air Quality   │  Pollen API    │   Weather API        │
│  (10K/month)   │  (5K/month)    │   (10K/month)        │
└────────────────┴────────────────┴───────────────────────┘
```

## 3. Technical Stack

### Frontend
- **Framework**: React Native 0.74+ with Expo SDK 51
- **Language**: TypeScript
- **Navigation**: Expo Router (file-based routing)
- **UI Framework**: NativeWind v4 (TailwindCSS for RN)
- **State Management**: Zustand
- **Forms**: React Hook Form + Zod validation
- **Animations**: React Native Reanimated 3
- **Icons**: Expo Vector Icons + Custom Kawaii SVGs

### Backend
- **Database**: Supabase (PostgreSQL 15)
- **Auth**: Supabase Auth (email/password + OAuth)
- **API Layer**: Supabase Edge Functions (Deno)
- **File Storage**: Supabase Storage (for avatars)
- **Push Notifications**: Expo Push Notification Service
- **Caching**: PostgreSQL + Redis (via Upstash)

### External Services
- **Maps**: Google Maps Platform
  - Air Quality API
  - Pollen API  
  - Current Conditions API (Weather/Lightning)
  - Places API (location search)
- **Analytics**: PostHog (self-hosted on Supabase)
- **Error Tracking**: Sentry
- **CI/CD**: EAS Build + GitHub Actions

## 4. Database Schema

```sql
-- Users table (managed by Supabase Auth)
-- auth.users

-- User profiles
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  name TEXT NOT NULL,
  health_concerns TEXT[] DEFAULT '{}',
  notification_enabled BOOLEAN DEFAULT true,
  notification_time TIME DEFAULT '07:00',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User locations
CREATE TABLE locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  google_place_id TEXT,
  show_in_home BOOLEAN DEFAULT true,
  notify_daily BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_user_location UNIQUE(user_id, latitude, longitude)
);

-- Location clusters for caching
CREATE TABLE location_clusters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  center_lat DECIMAL(10, 8) NOT NULL,
  center_lng DECIMAL(11, 8) NOT NULL,
  radius_meters INTEGER DEFAULT 1000,
  location_count INTEGER DEFAULT 0,
  
  CONSTRAINT unique_cluster UNIQUE(center_lat, center_lng, radius_meters)
);

-- Cached API responses
CREATE TABLE api_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cluster_id UUID REFERENCES location_clusters(id),
  api_type TEXT NOT NULL, -- 'aqi', 'pollen', 'weather'
  response_data JSONB NOT NULL,
  fetched_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  
  CONSTRAINT unique_cache_entry UNIQUE(cluster_id, api_type)
);

-- Push notification tokens
CREATE TABLE push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('ios', 'android')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_user_token UNIQUE(user_id, token)
);
```

## 5. Implementation Phases

### Phase 1: Foundation (Week 1-2)
- [ ] **1.1 Project Setup**
  - Initialize Expo project with TypeScript
  - Configure NativeWind v4
  - Set up ESLint, Prettier, and TypeScript configs
  - Configure Sentry error tracking
  
- [ ] **1.2 Supabase Setup**
  - Create Supabase project
  - Implement database schema
  - Configure authentication (email/password)
  - Set up Row Level Security policies

- [ ] **1.3 Core Navigation**
  - Implement Expo Router structure
  - Create tab navigation (Home, Profile, Settings)
  - Add authentication flow screens

### Phase 2: Authentication & Profile (Week 2-3)
- [ ] **2.1 Authentication Flow**
  - Sign up / Sign in screens
  - Password reset flow
  - Protected route handling
  - Secure token management

- [ ] **2.2 Profile Management**
  - Profile creation/editing
  - Health concerns selection (multi-select)
  - Location search with Google Places
  - Save up to 3 locations per profile

### Phase 3: Data Integration (Week 3-4)
- [ ] **3.1 API Integration**
  - Create Supabase Edge Functions for API proxy
  - Implement location clustering algorithm
  - Cache management with 1-hour expiry
  - Rate limit handling

- [ ] **3.2 State Management**
  - Zustand store setup
  - Offline data persistence
  - API response caching
  - Location data management

### Phase 4: Home Screen & Data Display (Week 4-5)
- [ ] **4.1 Home Screen UI**
  - Kawaii character integration
  - AQI card with color coding
  - Pollen count display
  - Lightning risk indicator
  - Timestamp and source info

- [ ] **4.2 Location Management**
  - Quick location switcher
  - Multiple location cards (up to 3)
  - Pull-to-refresh functionality
  - Loading and error states

### Phase 5: Push Notifications (Week 5-6)
- [ ] **5.1 Notification Setup**
  - Expo Push Notification configuration
  - Token registration flow
  - Permission handling (iOS/Android)
  
- [ ] **5.2 Daily Notifications**
  - Edge Function for scheduled notifications
  - Daily summary generation
  - User preference handling
  - Quiet hours implementation

### Phase 6: Polish & Testing (Week 6-7)
- [ ] **6.1 Onboarding Flow**
  - Tutorial screens with Kawaii guides
  - Permission explanations
  - Feature highlights
  
- [ ] **6.2 Testing & Optimization**
  - Unit tests for critical functions
  - Integration tests for API flows
  - Performance optimization
  - Accessibility improvements

- [ ] **6.3 Coming Soon Section**
  - Premium features preview
  - "Notify me" functionality
  - Feature request collection

## 6. Key Technical Decisions

### Caching Strategy
```typescript
// Location clustering algorithm
// Group locations within 1km radius to minimize API calls
interface LocationCluster {
  center: { lat: number; lng: number };
  locations: Location[];
  lastFetched: Date;
  cacheExpiry: Date;
}
```

### API Rate Limit Management
- Implement exponential backoff for failed requests
- Queue API calls to respect rate limits
- Prioritize user's primary location for updates
- Batch requests for efficiency

### Offline Support
- Cache last 72 hours of data locally
- Show cached data with "offline" indicator
- Queue notification preferences for sync
- Graceful degradation of features

## 7. Security Considerations

- **API Keys**: Store in Supabase Edge Functions, never in client
- **Row Level Security**: Users can only access their own data
- **Token Security**: Use Expo SecureStore for sensitive data
- **HTTPS Only**: All API communications over HTTPS
- **Input Validation**: Zod schemas for all user inputs

## 8. Performance Targets

- **App Launch**: < 2 seconds to interactive
- **API Response**: < 3 seconds for all data
- **Offline Mode**: Instant with cached data
- **Memory Usage**: < 150MB active
- **Battery Impact**: < 5% daily with notifications

## 9. Testing Strategy

### Unit Tests
- Utility functions (clustering, data formatting)
- State management logic
- API response parsing

### Integration Tests
- Authentication flows
- API integration with caching
- Push notification delivery

### E2E Tests (Post-MVP)
- Critical user journeys
- Cross-platform compatibility

## 10. Monitoring & Analytics

### Analytics Events
- User registration/login
- Location added/removed
- Notification enabled/disabled
- Feature usage patterns

### Performance Monitoring
- API response times
- Cache hit rates
- App crash rates
- Push notification delivery rates