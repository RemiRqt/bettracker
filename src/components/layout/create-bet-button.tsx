"use client";

import { Plus } from "lucide-react";
import { useBetModal } from "@/components/paris/bet-modal-provider";

export function CreateBetButton({ className }: { className?: string }) {
  const { open } = useBetModal();
  return (
    <button
      type="button"
      onClick={open}
      aria-label="Nouveau pari"
      className={className}
    >
      <Plus className="h-4 w-4" />
    </button>
  );
}
