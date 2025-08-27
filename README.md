# BreathRight Mobile App

React Native implementation of the BreathRight air quality monitoring application.

## 📱 Overview

This is the mobile client for BreathRight, built with React Native and Expo. It provides real-time air quality monitoring with kawaii character visualizations, helping families make informed decisions about outdoor activities.

For overall project documentation, see the [root README](../README.md).

## 📚 Documentation

- [Technical Specification](../docs/specs/technical-spec.md) - Complete technical implementation guide
- [Product Requirements](../docs/specs/product-requirements.md) - Detailed product vision and requirements
- [API Research](../docs/specs/api-research.md) - Comprehensive API analysis and recommendations
- [Setup Guide](../docs/SETUP.md) - Development environment setup
- [Development Guide](../docs/DEVELOPMENT.md) - Development workflow and best practices
- [Architecture Decisions](../docs/architecture/decisions.md) - Key technical decisions and rationale

## 🚀 Quick Start

```bash
# From the mobile directory
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# Start Expo development server
npm start

# Or run the full stack from root directory
cd .. && npm run dev
```

## 🏗️ Mobile Tech Stack

- **Framework**: React Native 0.74+ with Expo SDK 51
- **Language**: TypeScript
- **Navigation**: Expo Router (file-based)
- **Styling**: NativeWind v4 (TailwindCSS)
- **State Management**: Zustand
- **Forms**: React Hook Form + Zod
- **Animations**: React Native Reanimated 3
- **Icons**: Expo Vector Icons + Custom Kawaii SVGs

## 📁 Mobile Project Structure

```
mobile/
├── app/                # Expo Router screens
│   ├── (auth)/        # Authentication flow
│   ├── (tabs)/        # Main app tabs
│   └── _layout.tsx    # Root layout
├── components/        # Reusable UI components
├── lib/              # Libraries and utilities
│   ├── supabase/     # Supabase client
│   └── api/          # API service layer
├── store/            # Zustand state stores
├── types/            # TypeScript types
├── utils/            # Helper functions
├── constants/        # App constants
└── assets/           # Images, fonts, etc.
```

## 🔧 Available Scripts

From the `mobile/` directory:

```bash
# Start development server
npm start

# Run on iOS simulator
npm run ios

# Run on Android emulator  
npm run android

# Run tests
npm test

# Type check
npm run type-check

# Lint code
npm run lint
```

## 🌍 Environment Variables

Create `.env.local` in the mobile directory:

```bash
# Supabase Connection
EXPO_PUBLIC_SUPABASE_URL=http://localhost:54321
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-local-anon-key

# Feature Flags
EXPO_PUBLIC_ENABLE_ANALYTICS=false
EXPO_PUBLIC_ENABLE_SENTRY=false
```

## 📱 Features Implemented

### Phase 1: Foundation ✅
- [x] Expo TypeScript setup
- [x] NativeWind configuration
- [x] Navigation structure
- [ ] Supabase integration

### Phase 2: Authentication 🚧
- [ ] Sign up/Sign in screens
- [ ] Profile management
- [ ] Protected routes

### Phase 3: Core Features 📋
- [ ] Home screen with AQI display
- [ ] Location management
- [ ] Kawaii character states
- [ ] Push notifications

## 🧪 Testing

```bash
# Unit tests
npm test

# Watch mode
npm test -- --watch

# Coverage report
npm test -- --coverage
```

## 📦 Building

```bash
# Development build
eas build --profile development

# Preview build
eas build --profile preview

# Production build
eas build --profile production
```

## 🐛 Debugging

- Press `d` in terminal to open developer menu
- Press `shift + m` to toggle performance monitor
- Use React Native Debugger for advanced debugging

## 📄 License

Proprietary - All rights reserved