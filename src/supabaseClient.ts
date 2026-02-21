import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || ''
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || ''

// Debug: Log environment variable status (without exposing the full key)
console.log('🔍 Supabase Configuration Check:')
console.log('  URL:', supabaseUrl ? `✅ Set (${supabaseUrl.substring(0, 30)}...)` : '❌ Missing')
console.log('  Anon Key:', supabaseAnonKey ? `✅ Set (${supabaseAnonKey.substring(0, 20)}...)` : '❌ Missing')

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Supabase environment variables are not set!')
  console.error('Please check your .env file and ensure:')
  console.error('- REACT_APP_SUPABASE_URL is set')
  console.error('- REACT_APP_SUPABASE_ANON_KEY is set')
  console.error('- You have restarted your dev server after creating/editing .env')
  console.error('')
  console.error('The app will fallback to localStorage until Supabase is configured.')
}

// Create client - ensure we have valid values
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Creating Supabase client with placeholder values. API calls will fail.')
}

export const supabase: SupabaseClient = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
)

// Export a helper to check if Supabase is configured
export const isSupabaseConfigured = (): boolean => {
  return !!(supabaseUrl && supabaseAnonKey && 
           supabaseUrl !== 'https://placeholder.supabase.co' &&
           supabaseAnonKey !== 'placeholder-key')
}
