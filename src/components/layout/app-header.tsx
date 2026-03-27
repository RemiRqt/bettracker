import Link from "next/link";
import { NavLinks } from "@/components/layout/nav-links";
import { UserMenu } from "@/components/auth/user-menu";

interface AppHeaderProps {
  email: string;
}

export function AppHeader({ email }: AppHeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-slate-700/50 bg-[#0f172a]/95 backdrop-blur-md">
      <div className="container mx-auto flex h-12 md:h-14 items-center justify-between px-4">
        <Link href="/" className="text-lg md:text-xl font-bold text-white">
          BetTracker
        </Link>

        <div className="hidden md:flex">
          <NavLinks variant="horizontal" />
        </div>

        <UserMenu email={email} />
      </div>
    </header>
  );
}
