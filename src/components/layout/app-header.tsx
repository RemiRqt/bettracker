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
      className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/95 backdrop-blur-md"
      style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
    >
      <div className="container mx-auto relative flex h-12 md:h-14 items-center px-4">
        {/* Desktop nav (gauche) */}
        <div className="hidden md:flex">
          <NavLinks variant="horizontal" />
        </div>

        {/* Titre centré, bicolore, theme-aware */}
        <Link
          href="/"
          className="absolute left-1/2 -translate-x-1/2 text-lg md:text-xl font-extrabold tracking-tight"
          aria-label="BetTracker"
        >
          <span className="text-primary">BET</span>
          <span className="text-secondary-foreground">tracker</span>
        </Link>

        {/* Droite : create (desktop) + admin */}
        <div className="ml-auto flex items-center gap-2">
          <CreateBetButton className="hidden md:flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform active:scale-95" />
          {isAdmin && (
            <Link
              href="/styleguide"
              title="Styleguide"
              aria-label="Styleguide"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-card transition-colors hover:border-primary/50"
            >
              <Palette className="h-4 w-4 text-muted-foreground" />
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
