import { createClient } from "@supabase/supabase-js"


// Credenciais Supabase vindas do ambiente
const supabaseUrl = process.env.SUPABASE_URL as string
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string
const supabaseSchema = (process.env.SUPABASE_SCHEMA as string) || "public"

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error("Supabase server credentials missing. Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env.local/.env")
}

export function createServerSupabaseClient() {
  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    db: {
      schema: supabaseSchema,
    },
    auth: {
      persistSession: false,
    },
  })
}
