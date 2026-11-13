import { Card, CardHeader, CardDescription, CardContent } from "@/components/ui/card";
import { LoginForm } from "@/components/auth/login-form";

export const metadata = { title: "Connexion | BetTracker" };

export default function LoginPage() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-background via-card to-background p-4">
      <Card className="w-full max-w-md rounded-2xl border border-primary/20 bg-card">
        <CardHeader className="space-y-3 pt-8 pb-2 text-center">
          <div className="mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/30 bg-primary/15">
            <span aria-hidden className="text-3xl">
              🎯
            </span>
          </div>
          <h1 className="text-3xl leading-none font-extrabold tracking-tight text-foreground">BetTracker</h1>
          <CardDescription className="text-base text-muted-foreground">Connectez-vous pour accéder à vos séries de paris</CardDescription>
        </CardHeader>
        <CardContent className="px-6 pt-4 pb-8">
          <LoginForm />
        </CardContent>
      </Card>
    </div>
  );
}
