import { createClient } from "@supabase/supabase-js";
import { envRequise, supabaseUrl } from "./env";

/**
 * Client clé de service (contourne la RLS) : serveur seulement (crons, admin). Toujours filtrer par
 * `user_id` dans les requêtes. Jamais importé par un composant (ESLint).
 */
export function createServiceClient() {
  return createClient(supabaseUrl(), envRequise(process.env.SUPABASE_SERVICE_ROLE_KEY, "SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
