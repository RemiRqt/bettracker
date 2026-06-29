import { createClient } from "@/lib/supabase/server";
import { getTransactions } from "@/actions/transactions";
import { ensureTeamMappings } from "@/actions/teams";
import { getNotificationSettings } from "@/actions/notifications";
import { TransactionForm } from "@/components/profile/transaction-form";
import { TransactionList } from "@/components/profile/transaction-list";
import { FollowedTeams } from "@/components/profile/followed-teams";
import { NotificationSettings } from "@/components/profile/notification-settings";
import { SignOutButton } from "@/components/profile/sign-out-button";
import { ThemeSelector } from "@/components/profile/theme-selector";
import { RollingNumber } from "@/components/ui/rolling-number";
import { getServerTheme } from "@/lib/theme.server";
import { User } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = { title: "Mon Profil | BetTracker" };

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const theme = await getServerTheme();

  const [transactions, teamMappings, notifSettings] = await Promise.all([
    getTransactions(),
    ensureTeamMappings(),
    getNotificationSettings(),
  ]);

  const totalDeposits = transactions
    .filter((t) => t.type === "depot")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalWithdrawals = transactions
    .filter((t) => t.type === "retrait")
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalDeposits - totalWithdrawals;

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Profile header + compact balance */}
      <div className="rounded-xl bg-card p-4 md:p-6">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-primary/10 border border-primary/25 flex items-center justify-center">
            <User className="h-6 w-6 text-primary/80" />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg font-semibold text-foreground font-[family-name:var(--font-poppins)]">
              Mon profil
            </h1>
            <p className="truncate text-sm text-muted-foreground">{user?.email}</p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 border-t border-border/50 pt-3">
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
              Dépôts
            </p>
            <p className="text-sm font-bold text-primary">
              +<RollingNumber value={totalDeposits} format="euros" />
            </p>
          </div>
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
              Retraits
            </p>
            <p className="text-sm font-bold text-destructive">
              -<RollingNumber value={totalWithdrawals} format="euros" />
            </p>
          </div>
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
              Solde en cours
            </p>
            <p
              className={`text-sm font-bold ${
                balance >= 0 ? "text-primary" : "text-destructive"
              }`}
            >
              {balance >= 0 ? "+" : ""}
              <RollingNumber value={balance} format="euros" />
            </p>
          </div>
        </div>
      </div>

      {/* Add transaction (popup) */}
      <TransactionForm />

      {/* Notifications */}
      <NotificationSettings
        initialEnabled={notifSettings.notifications_enabled}
      />

      {/* Mes équipes */}
      <div className="rounded-xl bg-card p-4 md:p-6">
        <FollowedTeams teamMappings={teamMappings} />
      </div>

      {/* Transaction history */}
      <div className="rounded-xl bg-card p-4 md:p-6">
        <h2 className="text-sm uppercase tracking-wide text-muted-foreground mb-4">
          Historique des transactions
        </h2>
        <TransactionList transactions={transactions} />
      </div>

      {/* Apparence */}
      <div className="rounded-xl bg-card p-4 md:p-6">
        <h2 className="text-sm uppercase tracking-wide text-muted-foreground mb-4">
          Apparence
        </h2>
        <ThemeSelector current={theme} />
      </div>

      {/* Sign out */}
      <SignOutButton />
    </div>
  );
}
