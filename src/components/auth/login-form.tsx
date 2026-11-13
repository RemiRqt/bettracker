"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

export function LoginForm() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    const { error } = isSignUp ? await supabase.auth.signUp({ email, password }) : await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    if (isSignUp) {
      setError(null);
      setLoading(false);
      setSuccess("Vérifiez votre boîte mail pour confirmer votre compte.");
      return;
    }

    // Écran (app) jamais visité dans cette session (déconnexion = cache routeur vidé) : rendu serveur frais.
    router.replace("/");
  }

  return (
    <div className="flex flex-col gap-5">
      <form onSubmit={handleEmailSubmit} className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <Label htmlFor="email" className="text-sm font-medium text-foreground">
            Email
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="vous@exemple.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            aria-invalid={error ? true : undefined}
            className="h-11 rounded-xl border-border/50 bg-muted/50 text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary"
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="password" className="text-sm font-medium text-foreground">
            Mot de passe
          </Label>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            aria-invalid={error ? true : undefined}
            className="h-11 rounded-xl border-border/50 bg-muted/50 text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary"
          />
        </div>

        {error && (
          <div role="alert" className="rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {success && (
          <div role="status" className="rounded-xl border border-primary/20 bg-primary/10 px-4 py-3 text-sm text-primary">
            {success}
          </div>
        )}

        <Button
          type="submit"
          className="h-11 w-full cursor-pointer rounded-xl bg-primary font-semibold text-primary-foreground hover:bg-primary/90"
          disabled={loading}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 aria-hidden className="h-4 w-4 motion-safe:animate-spin" />
              Chargement...
            </span>
          ) : isSignUp ? (
            "Créer un compte"
          ) : (
            "Se connecter"
          )}
        </Button>
      </form>

      <button
        type="button"
        onClick={() => {
          setIsSignUp(!isSignUp);
          setError(null);
          setSuccess(null);
        }}
        className="cursor-pointer text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
      >
        {isSignUp ? "Déjà un compte ? Se connecter" : "Pas encore de compte ? Créer un compte"}
      </button>
    </div>
  );
}
