import { createClient } from "@/lib/supabase/server";
import { getTransactions } from "@/actions/transactions";
import { ensureTeamMappings } from "@/actions/teams";
import { getNotificationSettings } from "@/actions/notifications";
import { TransactionForm } from "@/components/profile/transaction-form";
import { TransactionList } from "@/components/profile/transaction-list";
import { FollowedTeams } from "@/components/profile/followed-teams";
import { NotificationSettings } from "@/components/profile/notification-settings";
import { SignOutButton } from "@/components/profile/sign-out-button";
import { RollingNumber } from "@/components/ui/rolling-number";
import { User } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = { title: "Mon Profil | BetTracker" };

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

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
      <div className="rounded-xl bg-[#1e293b] p-4 md:p-6">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center">
            <User className="h-6 w-6 text-emerald-400/80" />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg font-semibold text-white font-[family-name:var(--font-poppins)]">
              Mon profil
            </h1>
            <p className="truncate text-sm text-slate-400">{user?.email}</p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 border-t border-slate-700/50 pt-3">
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-wide text-slate-500">
              Dépôts
            </p>
            <p className="text-sm font-bold text-emerald-400">
              +<RollingNumber value={totalDeposits} format="euros" />
            </p>
          </div>
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-wide text-slate-500">
              Retraits
            </p>
            <p className="text-sm font-bold text-red-400">
              -<RollingNumber value={totalWithdrawals} format="euros" />
            </p>
          </div>
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-wide text-slate-500">
              Solde en cours
            </p>
            <p
              className={`text-sm font-bold ${
                balance >= 0 ? "text-emerald-400" : "text-red-400"
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
      <div className="rounded-xl bg-[#1e293b] p-4 md:p-6">
        <FollowedTeams teamMappings={teamMappings} />
      </div>

      {/* Transaction history */}
      <div className="rounded-xl bg-[#1e293b] p-4 md:p-6">
        <h2 className="text-sm uppercase tracking-wide text-slate-400 mb-4">
          Historique des transactions
        </h2>
        <TransactionList transactions={transactions} />
      </div>

      {/* Sign out */}
      <SignOutButton />
    </div>
  );
}
