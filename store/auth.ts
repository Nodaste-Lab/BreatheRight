import { create } from 'zustand';
import { supabase } from '../lib/supabase/client';
import type { AuthStore, Profile } from '../types/auth';

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  profile: null,
  loading: false,
  initialized: false,

  initialize: async () => {
    try {
      set({ loading: true });
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        set({
          user: session.user,
          profile: profile || null,
          initialized: true,
          loading: false,
        });
      } else {
        set({
          user: null,
          profile: null,
          initialized: true,
          loading: false,
        });
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
  const { initialize } = useAuthStore.getState();
  
  if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
    initialize();
  }
});