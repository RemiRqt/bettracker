import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "@/components/layout/app-header";
import { BottomNav } from "@/components/layout/bottom-nav";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-[#0f172a]">
      <AppHeader email={user.email!} />
      <main
        className="container mx-auto px-3 md:px-4 md:pb-6"
        style={{
          paddingTop: "3.25rem",
          paddingBottom: "calc(3.75rem + env(safe-area-inset-bottom, 0px))",
        }}
      >
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
