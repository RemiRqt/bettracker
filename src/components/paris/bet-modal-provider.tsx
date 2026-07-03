"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
} from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { getBetFormData } from "@/actions/bets";
import {
  BetForm,
  type ExistingSubject,
  type TeamMappingLite,
} from "@/components/paris/bet-form";

interface BetModalContextValue {
  open: () => void;
}

const BetModalContext = createContext<BetModalContextValue | null>(null);

export function useBetModal(): BetModalContextValue {
  const ctx = useContext(BetModalContext);
  if (!ctx) throw new Error("useBetModal doit être utilisé dans BetModalProvider");
  return ctx;
}

interface FormData {
  existingSubjects: ExistingSubject[];
  teamMappings: TeamMappingLite[];
}

export function BetModalProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<FormData | null>(null);
  const [loading, setLoading] = useState(false);

  const openModal = useCallback(async () => {
    setOpen(true);
    setLoading(true);
    try {
      const d = await getBetFormData();
      setData(d as FormData);
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <BetModalContext.Provider value={{ open: openModal }}>
      {children}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-card border border-border max-h-[90vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-foreground">Nouveau pari</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Reprise de série, nouvelle série ou pari unique
            </DialogDescription>
          </DialogHeader>
          {loading || !data ? (
            <div className="flex items-center justify-center py-10 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <BetForm
              existingSubjects={data.existingSubjects}
              teamMappings={data.teamMappings}
              onSuccess={() => setOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </BetModalContext.Provider>
  );
}
