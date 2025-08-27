# Architecture Decision Records

## ADR-001: React Native with Expo

**Status**: Accepted  
**Date**: 2024-01-15

### Context
Need cross-platform mobile development with rapid iteration capability.

### Decision
Use React Native with Expo framework.

### Consequences
- ✅ Single codebase for iOS/Android
- ✅ Fast development with hot reload
- ✅ Access to Expo ecosystem
- ❌ Some native modules require ejecting
- ❌ Larger app size than pure native

---

## ADR-002: Supabase for Backend

**Status**: Accepted  
**Date**: 2024-01-16

### Context
Need managed backend with real-time capabilities, authentication, and PostgreSQL.

### Decision
Use Supabase for all backend services.

### Consequences
- ✅ Managed PostgreSQL database
- ✅ Built-in authentication
- ✅ Real-time subscriptions
- ✅ Edge Functions for API proxy
- ❌ Vendor lock-in
- ❌ Limited to PostgreSQL

---

## ADR-003: Location Clustering Algorithm

**Status**: Accepted  
**Date**: 2024-01-20

### Context
Need to minimize API calls while maintaining data freshness for nearby locations.

### Decision
Implement 1km radius clustering for API requests.

### Implementation
```typescript
// Cluster locations within 1km radius
const CLUSTER_RADIUS = 1000; // meters

function clusterLocations(locations: Location[]): Cluster[] {
  // Group locations within radius
  // Make single API call per cluster
  // Cache results for all locations in cluster
}
```

### Consequences
- ✅ Reduces API calls by ~70%
- ✅ Lower costs
- ✅ Faster response times
- ❌ Less precise data at cluster edges
- ❌ Additional complexity

---

## ADR-004: Zustand for State Management

**Status**: Accepted  
**Date**: 2024-01-22

### Context
Need simple, TypeScript-friendly state management without boilerplate.

### Decision
Use Zustand over Redux or Context API.

### Consequences
- ✅ Minimal boilerplate
- ✅ Built-in persistence
- ✅ TypeScript support
- ✅ Small bundle size (8kb)
- ❌ Less ecosystem than Redux
- ❌ Fewer debugging tools

---

## ADR-005: NativeWind for Styling

**Status**: Accepted  
**Date**: 2024-01-23

### Context
Need consistent styling system that designers understand.

### Decision
Use NativeWind (TailwindCSS for React Native).

### Consequences
- ✅ Familiar to web developers
- ✅ Consistent with design system
- ✅ Fast development
- ❌ Learning curve for native developers
- ❌ Limited to Tailwind classes