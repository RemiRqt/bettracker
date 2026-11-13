import Link from "next/link";
import { Palette } from "lucide-react";
import { NavLinks } from "@/components/layout/nav-links";
import { CreateBetButton } from "@/components/layout/create-bet-button";
import { ADMIN_EMAILS } from "@/lib/constants";

interface AppHeaderProps {
  email: string;
}

export function AppHeader({ email }: AppHeaderProps) {
  const isAdmin = ADMIN_EMAILS.includes(email);

  return (
    <header
      className="fixed top-0 right-0 left-0 z-50 border-b border-border/50 bg-background/95 backdrop-blur-md"
      style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
    >
      <div className="relative container mx-auto flex h-12 items-center px-4 md:h-14">
        {/* Desktop nav (gauche) */}
        <div className="hidden md:flex">
          <NavLinks variant="horizontal" />
        </div>

        {/* Titre centré, bicolore, theme-aware */}
        <Link href="/" className="absolute left-1/2 -translate-x-1/2 text-lg font-extrabold tracking-tight md:text-xl" aria-label="BetTracker">
          <span className="text-primary">BET</span>
          <span className="text-secondary-foreground">tracker</span>
        </Link>

        {/* Droite : create (desktop) + admin */}
        <div className="ml-auto flex items-center gap-2">
          <CreateBetButton className="relative hidden h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform before:absolute before:-inset-1.5 before:content-[''] active:scale-95 md:flex" />
          {isAdmin && (
            <Link
              href="/styleguide"
              title="Styleguide"
              aria-label="Styleguide"
              className="relative flex h-8 w-8 items-center justify-center rounded-full border border-border bg-card transition-colors before:absolute before:-inset-1.5 before:content-[''] hover:border-primary/50"
            >
              <Palette aria-hidden className="h-4 w-4 text-muted-foreground" />
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
