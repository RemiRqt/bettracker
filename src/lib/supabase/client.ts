import { createBrowserClient } from "@supabase/ssr";
import { Database } from "@/lib/types/database";
import { supabaseAnonKey, supabaseUrl } from "./env";

export function createClient() {
  return createBrowserClient<Database>(supabaseUrl(), supabaseAnonKey());
}
