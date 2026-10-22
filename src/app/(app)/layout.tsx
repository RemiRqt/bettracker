import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/supabase/server";
import { AppHeader } from "@/components/layout/app-header";
import { BottomNav } from "@/components/layout/bottom-nav";
import { ConfirmDialogProvider } from "@/components/ui/confirm-dialog";
import { BetModalProvider } from "@/components/paris/bet-modal-provider";
import { Toaster } from "@/components/ui/toaster";
import { RouteTransition } from "@/components/layout/route-transition";
import { SplashScreen } from "@/components/layout/splash-screen";
import { WhatsNewLauncher } from "@/components/whats-new/whats-new-launcher";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = await getAuthUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <ConfirmDialogProvider>
      <BetModalProvider>
        <div className="min-h-screen bg-background">
          <SplashScreen />
          <AppHeader email={user.email!} />
          <RouteTransition />
          <main
            className="container mx-auto px-3 md:px-4 md:pb-6"
            style={{
              paddingTop: "3.5rem",
              paddingBottom: "calc(5.5rem + env(safe-area-inset-bottom, 0px))",
            }}
          >
            {children}
          </main>
          <BottomNav />
          <Toaster />
          <WhatsNewLauncher />
        </div>
      </BetModalProvider>
    </ConfirmDialogProvider>
  );
}
