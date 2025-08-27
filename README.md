# BreathRight

Mobile-first air quality management app delivering real-time AQI and pollen data alerts for health-conscious families.

## 🎯 Overview

BreathRight helps parents, outdoor enthusiasts, and health-conscious individuals make informed decisions about outdoor activities through hyper-local air quality monitoring, predictive health alerts, and delightful kawaii character visualizations.

## 📚 Documentation

- [Technical Specification](./docs/specs/technical-spec.md) - Complete technical implementation guide
- [Product Requirements](./docs/specs/product-requirements.md) - Detailed product vision and requirements
- [API Research](./docs/specs/api-research.md) - Comprehensive API analysis and recommendations
- [Setup Guide](./docs/SETUP.md) - Development environment setup
- [Development Guide](./docs/DEVELOPMENT.md) - Development workflow and best practices
- [Architecture Decisions](./docs/architecture/decisions.md) - Key technical decisions and rationale

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# Start development server
npx expo start
```

## 🏗️ Tech Stack

- **Frontend**: React Native + Expo
- **Styling**: NativeWind (TailwindCSS)
- **Backend**: Supabase
- **APIs**: Google Maps Platform (Air Quality, Pollen, Weather)
- **State**: Zustand
- **Push Notifications**: Expo Push Service

## 📱 Features (MVP)

- ✅ Real-time AQI display with kawaii character reactions
- ✅ Pollen count readings with health indicators
- ✅ Lightning risk assessment
- ✅ Multi-location support (up to 3 locations)
- ✅ Daily push notifications
- ✅ User profiles with health considerations
- ✅ Dark mode support

## 🗓️ Project Status

**Current Phase**: MVP Development - Phase 1 of 6

See [CHANGELOG.md](./CHANGELOG.md) for detailed progress.

## 📄 License

Proprietary - All rights reserved