import Link from "next/link";
import { User } from "lucide-react";

interface UserMenuProps {
  email: string;
}

export function UserMenu({ email }: UserMenuProps) {
  return (
    <Link
      href="/profile"
      className="h-8 w-8 rounded-full bg-[#1e293b] border border-slate-600 flex items-center justify-center hover:border-slate-400 transition-colors"
      title={email}
    >
      <User className="h-4 w-4 text-slate-400" />
    </Link>
  );
}
