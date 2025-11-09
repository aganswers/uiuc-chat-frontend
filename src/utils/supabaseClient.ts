import { createClient } from '@supabase/supabase-js'

function getSupabaseUrl(): string {
  return (
    process.env.AGANSWERS_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    ''
  )
}

function getSupabaseKey(): string {
  return (
    process.env.AGANSWERS_SUPABASE_SERVICE_ROLE_KEY ||
    process.env.AGANSWERS_SUPABASE_API_KEY ||
    process.env.SUPABASE_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_API_KEY ||
    ''
  )
}

const supabaseUrl = getSupabaseUrl()
const supabaseKey = getSupabaseKey()

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables for service client')
}

export const supabase = createClient(supabaseUrl, supabaseKey)
