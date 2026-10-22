export type AuthUser = { id: string; email: string | undefined };

/** Utilisateur lu dans les claims du jeton Supabase (null si pas connecté). */
export function userFromClaims(claims: Record<string, unknown> | null | undefined): AuthUser | null {
  if (!claims || typeof claims.sub !== "string") return null;
  return { id: claims.sub, email: typeof claims.email === "string" ? claims.email : undefined };
}
