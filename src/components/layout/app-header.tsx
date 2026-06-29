import Link from "next/link";
import { Palette } from "lucide-react";
import { NavLinks } from "@/components/layout/nav-links";
import { UserMenu } from "@/components/auth/user-menu";
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
      <div className="container mx-auto flex h-12 md:h-14 items-center justify-between px-4">
        <Link href="/" className="text-lg md:text-xl font-bold text-foreground">
          BetTracker
        </Link>

        <div className="hidden md:flex">
          <NavLinks variant="horizontal" />
        </div>

        <div className="flex items-center gap-2">
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
          <UserMenu email={email} />
        </div>
      </div>
    </header>
  );
}
