"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

interface ConfirmOptions {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "default" | "destructive";
}

type ConfirmFn = (opts: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

export function ConfirmDialogProvider({ children }: { children: React.ReactNode }) {
  const [opts, setOpts] = useState<ConfirmOptions | null>(null);
  const resolverRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback<ConfirmFn>((options) => {
    setOpts(options);
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
    });
  }, []);

  const handleResolve = (value: boolean) => {
    resolverRef.current?.(value);
    resolverRef.current = null;
    setOpts(null);
  };

  const isDestructive = opts?.variant === "destructive";

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <AlertDialog
        open={opts !== null}
        onOpenChange={(open) => {
          if (!open) handleResolve(false);
        }}
      >
        <AlertDialogContent className="bg-background border-border text-foreground max-w-sm mx-auto rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground text-base">
              {opts?.title}
            </AlertDialogTitle>
            {opts?.description && (
              <AlertDialogDescription className="text-muted-foreground text-sm">
                {opts.description}
              </AlertDialogDescription>
            )}
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 flex-row">
            <AlertDialogCancel
              onClick={() => handleResolve(false)}
              className="flex-1 mt-0 rounded-xl bg-transparent border-border text-secondary-foreground hover:bg-card hover:text-foreground"
            >
              {opts?.cancelLabel ?? "Annuler"}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleResolve(true)}
              className={cn(
                "flex-1 rounded-xl font-medium",
                isDestructive
                  ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  : "bg-primary text-primary-foreground hover:bg-primary/90"
              )}
            >
              {opts?.confirmLabel ?? "Confirmer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ConfirmContext.Provider>
  );
}

export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmContext);
  if (!ctx) {
    throw new Error("useConfirm must be used within ConfirmDialogProvider");
  }
  return ctx;
}
