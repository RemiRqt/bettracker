"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function addTransaction(formData: FormData) {
  const type = formData.get("type") as string | null;
  const amountRaw = formData.get("amount") as string | null;
  const note = (formData.get("note") as string | null) || null;

  if (!type || !["depot", "retrait"].includes(type)) {
    return { error: "Type de transaction invalide." };
  }

  if (!amountRaw) {
    return { error: "Le montant est requis." };
  }

  const amount = parseFloat(amountRaw);
  if (isNaN(amount) || amount <= 0) {
    return { error: "Le montant doit être un nombre positif." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Vous devez être connecté." };
  }

  const { error } = await supabase.from("transactions").insert({
    user_id: user.id,
    type,
    amount,
    note: note && note.trim() ? note.trim() : null,
  });

  if (error) {
    return { error: "Erreur lors de l'ajout de la transaction." };
  }

  revalidatePath("/profile");
  revalidatePath("/");

  return {};
}

export async function getTransactions() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const { data } = await supabase
    .from("transactions")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return data ?? [];
}

export async function deleteTransaction(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Vous devez être connecté." };
  }

  const { error } = await supabase
    .from("transactions")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return { error: "Erreur lors de la suppression." };
  }

  revalidatePath("/profile");
  revalidatePath("/");

  return {};
}
