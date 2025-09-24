import type { User } from '@supabase/supabase-js';

export interface Profile {
  id: string;
  name: string;
  health_concerns: string[];
  notification_enabled: boolean;
  notification_time: string;
  /**
   * User's selected weather data source
   * - microsoft: Microsoft Azure Maps (default) - Most comprehensive data
   * - google: Google Maps API - Strong AQI with health recommendations
   * - waqi: World Air Quality Index - Global coverage
   * - purpleair: PurpleAir sensors - Hyperlocal community data
   * - airnow: US EPA AirNow - Official government data
   * - openweather: OpenWeatherMap - Weather-focused, limited AQI
   */
  weather_source?: 'openweather' | 'microsoft' | 'google' | 'waqi' | 'purpleair' | 'airnow';
  created_at: string;
  updated_at: string;
}

export interface AuthState {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  initialized: boolean;
}

export interface AuthActions {
  signIn: (email: string, password: string) => Promise<void>;
  signInWithMagicLink: (email: string) => Promise<{ needsEmailConfirmation: boolean }>;
  verifyOtp: (email: string, token: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signUpWithOtp: (email: string, name: string) => Promise<{ needsEmailConfirmation: boolean }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  initialize: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
}

export type AuthStore = AuthState & AuthActions;