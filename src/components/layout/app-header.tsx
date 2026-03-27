import Link from "next/link";
import { NavLinks } from "@/components/layout/nav-links";
import { MobileNav } from "@/components/layout/mobile-nav";
import { UserMenu } from "@/components/auth/user-menu";
import { Separator } from "@/components/ui/separator";

interface AppHeaderProps {
  email: string;
}

export function AppHeader({ email }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <MobileNav />
          <Link href="/" className="text-xl font-bold">
            BetTracker
          </Link>
        </div>

        <div className="hidden md:flex">
          <NavLinks />
        </div>

        <UserMenu email={email} />
      </div>
    </header>
  );
}
