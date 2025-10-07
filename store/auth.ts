import { create } from 'zustand';
import { supabase } from '../lib/supabase/client';
import type { AuthStore, Profile } from '../types/auth';
import { useSubscriptionStore } from './subscription';

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  profile: null,
  loading: false,
  initialized: false,

  initialize: async () => {
    try {
      console.log('=== AUTH INITIALIZE START ===');
      set({ loading: true });

      const { data: { session } } = await supabase.auth.getSession();
      console.log('Session in initialize:', session ? 'exists' : 'null');
      console.log('User in initialize:', session?.user?.id || 'No user');

      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        console.log('Setting user in auth store:', session.user.id);
        set({
          user: session.user,
          profile: profile || null,
          initialized: true,
          loading: false,
        });
        console.log('=== AUTH INITIALIZE END: User set ===');
      } else {
        console.log('No session found, setting user to null');
        set({
          user: null,
          profile: null,
          initialized: true,
          loading: false,
        });
        console.log('=== AUTH INITIALIZE END: No user ===');
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      set({
        user: null,
        profile: null,
        initialized: true,
        loading: false,
      });
    }
  },

  signUp: async (email: string, password: string, name: string) => {
    set({ loading: true });

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name }
      }
    });

    if (error) {
      set({ loading: false });
      throw error;
    }

    console.log('Sign up result:', { user: data.user, session: data.session });

    // If email confirmation is disabled, user will have a session immediately
    if (data.session && data.user) {
      console.log('User signed in immediately (email confirmation disabled)');
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      set({
        user: data.user,
        profile: profile || null,
        loading: false,
      });
    } else {
      console.log('User created but needs email confirmation');
      set({ loading: false });
    }
  },

  signUpWithOtp: async (email: string, name: string) => {
    set({ loading: true });

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        data: { name }
      },
    });

    set({ loading: false });

    if (error) {
      throw error;
    }

    // Return success - user needs to check email
    return { needsEmailConfirmation: true };
  },

  signIn: async (email: string, password: string) => {
    set({ loading: true });

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      set({ loading: false });
      throw error;
    }

    if (data.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      set({
        user: data.user,
        profile: profile || null,
        loading: false,
      });
    }
  },

  signInWithMagicLink: async (email: string) => {
    set({ loading: true });

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
      },
    });

    set({ loading: false });

    if (error) {
      throw error;
    }

    // Return success - user needs to check email
    return { needsEmailConfirmation: true };
  },

  verifyOtp: async (email: string, token: string) => {
    set({ loading: true });

    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email',
    });

    if (error) {
      set({ loading: false });
      throw error;
    }

    if (data.user && data.session) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      set({
        user: data.user,
        profile: profile || null,
        loading: false,
      });
    } else {
      set({ loading: false });
    }
  },

  signOut: async () => {
    set({ loading: true });

    const { error } = await supabase.auth.signOut();

    if (error) {
      set({ loading: false });
      throw error;
    }

    // Reset subscription store on sign out
    useSubscriptionStore.setState({
      hasActiveSubscription: false,
      hasPremiumAccess: false,
      currentSubscription: null,
      purchases: [],
      error: null,
    });

    set({
      user: null,
      profile: null,
      loading: false,
    });
  },

  resetPassword: async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/(auth)/reset-password`,
    });
    
    if (error) {
      throw error;
    }
  },

  updatePassword: async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });
    
    if (error) {
      throw error;
    }
  },

  updateProfile: async (updates: Partial<Profile>) => {
    const { user } = get();
    
    if (!user) {
      throw new Error('No authenticated user');
    }

    set({ loading: true });

    const { data, error } = await supabase
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', user.id)
      .select()
      .single();

    if (error) {
      set({ loading: false });
      throw error;
    }

    set({
      profile: data,
      loading: false,
    });
  },
}));

// Listen for auth changes
supabase.auth.onAuthStateChange((event, session) => {
  console.log('=== AUTH STATE CHANGE ===');
  console.log('Event:', event);
  console.log('Session exists:', !!session);
  console.log('User:', session?.user?.id || 'No user');

  const { initialize } = useAuthStore.getState();

  if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
    console.log('Calling auth initialize due to', event);
    initialize();
  }
});