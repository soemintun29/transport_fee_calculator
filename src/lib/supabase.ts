import { createClient } from '@supabase/supabase-js';

const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseAnonKey) {
  throw new Error('Missing Supabase credentials');
}

/**
 * Browser traffic goes to this site's /sb path. Vercel (or the Vite dev
 * proxy) forwards it to Supabase, so the visitor does not open *.supabase.co.
 */
const supabaseUrl =
  typeof window !== 'undefined' ? `${window.location.origin}/sb` : '/sb';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
