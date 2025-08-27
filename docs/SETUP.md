# BreathRight Setup Guide

This guide walks through setting up your development environment for BreathRight.

## Prerequisites

- Node.js 18+ and npm
- Git
- Expo CLI
- iOS Simulator (Mac) or Android Studio (Windows/Linux/Mac)
- VS Code with Claude Code

## Initial Setup

### 1. Clone Repository

```bash
git clone [your-repo-url]
cd breathright-app
```

### 2. Install Dependencies

```bash
# Install all npm packages
npm install

# Install Expo CLI globally if not already installed
npm install -g expo-cli eas-cli
```

### 3. Environment Configuration

```bash
# Copy example environment file
cp .env.example .env.local
```

Edit `.env.local` with your credentials:
```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Supabase Setup

1. Create account at [supabase.com](https://supabase.com)
2. Create new project
3. Go to SQL Editor and run the schema from `/docs/api/supabase-schema.sql`
4. Copy project URL and anon key from Settings > API
5. Update `.env.local` with these values

### 5. Google Maps Platform Setup

1. Create project in [Google Cloud Console](https://console.cloud.google.com)
2. Enable APIs:
   - Air Quality API
   - Pollen API
   - Places API
   - Maps SDK for iOS
   - Maps SDK for Android
3. Create API key with restrictions
4. Add to Supabase Edge Functions (see `/docs/api/google-maps-integration.md`)

## Running the App

### Development Server

```bash
# Start Expo development server
npx expo start

# iOS Simulator (Mac only)
# Press 'i' in terminal

# Android Emulator
# Press 'a' in terminal

# Physical Device
# Scan QR code with Expo Go app
```

### Build Commands

```bash
# Development build for iOS
eas build --platform ios --profile development

# Development build for Android  
eas build --platform android --profile development
```

## Troubleshooting

### Common Issues

1. **Metro bundler issues**
   ```bash
   npx expo start --clear
   ```

2. **iOS Simulator not opening**
   - Open Xcode > Preferences > Locations
   - Ensure Command Line Tools are selected

3. **Android build failures**
   ```bash
   cd android && ./gradlew clean
   cd .. && npx expo run:android
   ```

## VS Code Setup

### Recommended Extensions

- Expo Tools
- Tailwind CSS IntelliSense  
- ES7+ React snippets
- TypeScript Error Translator
- Prettier
- ESLint

### Claude Code Usage

1. Open project in VS Code
2. Reference specs in `/docs/specs/` when prompting
3. Use relative paths for file references
4. Test incrementally

## Next Steps

See [Development Guide](./DEVELOPMENT.md) for coding standards and workflow.