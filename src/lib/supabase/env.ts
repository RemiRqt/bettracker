/** Variable d'environnement requise : erreur explicite si elle manque (au lieu d'un `undefined` passé plus loin). */
export function envRequise(valeur: string | undefined, nom: string): string {
  if (!valeur) throw new Error(`${nom} manquant`);
  return valeur;
}

// Les NEXT_PUBLIC_* sont écrites en toutes lettres : Next les remplace par leur valeur dans le code du navigateur.
export const supabaseUrl = () => envRequise(process.env.NEXT_PUBLIC_SUPABASE_URL, "NEXT_PUBLIC_SUPABASE_URL");
export const supabaseAnonKey = () => envRequise(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, "NEXT_PUBLIC_SUPABASE_ANON_KEY");
