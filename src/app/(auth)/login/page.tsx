import {
  Card,
  CardHeader,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { LoginForm } from "@/components/auth/login-form";

export const metadata = { title: "Connexion | BetTracker" };

export default function LoginPage() {
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-background via-card to-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md rounded-2xl border border-primary/20 bg-card">
        <CardHeader className="text-center space-y-3 pt-8 pb-2">
          <div className="mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/30 bg-primary/15">
            <span aria-hidden className="text-3xl">🎯</span>
          </div>
          <h1 className="text-3xl font-extrabold leading-none tracking-tight text-foreground">
            BetTracker
          </h1>
          <CardDescription className="text-muted-foreground text-base">
            Connectez-vous pour accéder à vos séries de paris
          </CardDescription>
        </CardHeader>
        <CardContent className="px-6 pb-8 pt-4">
          <LoginForm />
        </CardContent>
      </Card>
    </div>
  );
}
