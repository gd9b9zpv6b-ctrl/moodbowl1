import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    '[supabase] Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY · see .env.example',
  );
}

/**
 * Expo / React Native client.
 * - No processLock: nested auth + profile reads can stall login on device.
 * - detectSessionInUrl only on web (Expo Go has no OAuth redirect callback by default).
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: Platform.OS === 'web',
    flowType: Platform.OS === 'web' ? 'pkce' : 'implicit',
    // Bypass navigator locks · prevents signIn + onAuthStateChange deadlocks on RN.
    lock: async (_name, _acquireTimeout, fn) => fn(),
  },
  global: {
    headers: {
      'x-application-name': 'moodbowl',
    },
  },
});

export default supabase;
