import Link from "next/link";
import { User } from "lucide-react";

interface UserMenuProps {
  email: string;
}

export function UserMenu({ email }: UserMenuProps) {
  return (
    <Link
      href="/profile"
      className="h-8 w-8 rounded-full bg-card border border-border flex items-center justify-center hover:border-muted-foreground transition-colors"
      title={email}
    >
      <User className="h-4 w-4 text-muted-foreground" />
    </Link>
  );
}
