import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ADMIN_EMAILS } from "@/lib/constants";
import { StyleguideClient } from "@/components/styleguide/styleguide-client";

export const metadata = { title: "Styleguide — BetTracker" };

/**
 * Page de référence de la charte graphique. Gatée sur les comptes ADMIN_EMAILS
 * (rranquet@gmail.com). Aucune donnée réelle : tout est mocké dans les sections.
 */
export default async function StyleguidePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !ADMIN_EMAILS.includes(user.email ?? "")) {
    redirect("/");
  }

  return <StyleguideClient />;
}
