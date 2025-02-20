import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { User } from '../types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (userData: {
    email: string;
    password: string;
    username: string;
    country: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
}

const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  login: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw error;
    }

    if (data.user) {
      // Fetch additional user data from your users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (userError) {
        // If user data doesn't exist, sign out and throw error
        await supabase.auth.signOut();
        throw new Error('User profile not found. Please contact support.');
      }

      set({
        user: {
          ...userData,
          plants: [] // Initialize empty plants array
        } as User,
        isAuthenticated: true,
      });
    }
  },
  signup: async ({ email, password, username, country }) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        if (error.message.includes('already registered')) {
          throw new Error('This email is already registered. Please try logging in instead.');
        }
        throw error;
      }

      if (!data.user) {
        throw new Error('Signup failed. Please try again.');
      }

      // Create a new user record in your users table
      const { error: profileError } = await supabase.from('users').insert([
        {
          id: data.user.id,
          username,
          email,
          country,
          is_admin: false,
        },
      ]);

      if (profileError) {
        // If profile creation fails, clean up by signing out
        await supabase.auth.signOut();
        if (profileError.message.includes('unique constraint')) {
          throw new Error('This username is already taken. Please choose another.');
        }
        throw profileError;
      }

      set({
        user: {
          id: data.user.id,
          username,
          email,
          country,
          is_admin: false,
          plants: [],
        },
        isAuthenticated: true,
      });
    } catch (error) {
      // Ensure we're signed out if anything fails
      await supabase.auth.signOut();
      throw error;
    }
  },
  logout: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw error;
    }
    set({ user: null, isAuthenticated: false });
  },
}));

export default useAuthStore;
