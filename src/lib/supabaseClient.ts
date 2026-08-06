/**
 * Supabase client · single shared instance.
 *
 * Environment variables (both required):
 *   NEXT_PUBLIC_SUPABASE_URL       Full URL of the Supabase project.
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY  Public anon key · safe to expose to client.
 *
 * ⚠️  NEVER put the service_role key on the client.
 */
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl: string | undefined = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey: string | undefined = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    '[supabaseClient] Missing env vars · set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env file (see .env.example).',
  );
}

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
  },
  global: {
    headers: {
      'x-application-name': 'moodbowl',
    },
  },
});

export default supabase;
