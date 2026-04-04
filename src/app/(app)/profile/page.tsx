import { createClient } from "@/lib/supabase/server";
import { getTransactions } from "@/actions/transactions";
import { ensureTeamMappings } from "@/actions/teams";
import { TransactionForm } from "@/components/profile/transaction-form";
import { TransactionList } from "@/components/profile/transaction-list";
import { FollowedTeams } from "@/components/profile/followed-teams";
import { SignOutButton } from "@/components/profile/sign-out-button";
import { User } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = { title: "Mon Profil | BetTracker" };

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [transactions, teamMappings] = await Promise.all([
    getTransactions(),
    ensureTeamMappings(),
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
      {/* Profile header */}
      <div className="rounded-xl bg-[#1e293b] p-4 md:p-6 flex items-center gap-4">
        <div className="h-12 w-12 rounded-full bg-[#0f172a] border border-slate-600 flex items-center justify-center">
          <User className="h-6 w-6 text-slate-400" />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-white font-[family-name:var(--font-poppins)]">
            Mon profil
          </h1>
          <p className="text-sm text-slate-400">{user?.email}</p>
        </div>
      </div>

      {/* Balance card */}
      <div className="rounded-xl bg-[#1e293b] p-4 md:p-6">
        <h2 className="text-sm uppercase tracking-wide text-slate-400 mb-4">
          Solde du compte
        </h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-xs text-slate-400 mb-1">Depots</p>
            <p className="text-lg font-semibold text-[#10b981]">
              +{totalDeposits.toFixed(2)} &euro;
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-slate-400 mb-1">Retraits</p>
            <p className="text-lg font-semibold text-red-400">
              -{totalWithdrawals.toFixed(2)} &euro;
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-slate-400 mb-1">Solde net</p>
            <p
              className={`text-lg font-semibold ${
                balance >= 0 ? "text-[#10b981]" : "text-red-400"
              }`}
            >
              {balance >= 0 ? "+" : ""}
              {balance.toFixed(2)} &euro;
            </p>
          </div>
        </div>
      </div>

      {/* Followed teams section */}
      <div className="rounded-xl bg-[#1e293b] p-4 md:p-6">
        <h2 className="text-sm uppercase tracking-wide text-slate-400 mb-4">
          Equipes suivies
        </h2>
        <FollowedTeams teamMappings={teamMappings} />
      </div>

      {/* Transaction form */}
      <TransactionForm />

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
