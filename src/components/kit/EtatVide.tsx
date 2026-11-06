// Message affiché quand une liste est vide : dit quoi faire, jamais un écran blanc.
export function EtatVide({ children }: { children: React.ReactNode }) {
  return <p className="rounded-2xl border border-dashed p-4 text-sm text-muted-foreground">{children}</p>;
}
