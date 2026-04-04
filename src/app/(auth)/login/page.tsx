import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { LoginForm } from "@/components/auth/login-form";

export const metadata = { title: "Connexion | BetTracker" };

export default function LoginPage() {
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] flex items-center justify-center p-4">
      <Card className="w-full max-w-md rounded-2xl border-border/50 bg-card/80 backdrop-blur-sm shadow-[0_0_60px_-15px_rgba(16,185,129,0.15)]">
        <CardHeader className="text-center space-y-3 pt-8 pb-2">
          <div className="text-5xl mb-2">🎯</div>
          <CardTitle className="text-3xl font-extrabold tracking-tight text-foreground">
            BetTracker
          </CardTitle>
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
