import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { logout } from "./actions";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const name = user?.user_metadata?.display_name ?? user?.email?.split("@")[0] ?? "Usuario";
  const adminEmails = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim().toLowerCase());
  const isAdmin = !!user?.email && adminEmails.includes(user.email.toLowerCase());

  return (
    <main className="flex min-h-screen flex-col p-6 max-w-sm mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Prode 2026</h1>
        <form action={logout}>
          <Button variant="ghost" size="sm" type="submit">Salir</Button>
        </form>
      </div>

      <div className="mt-8 space-y-4">
        <Link href="/profile" className="flex items-center gap-2 group w-fit">
          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-bold shrink-0">
            {name[0]?.toUpperCase() ?? "?"}
          </div>
          <p className="text-muted-foreground group-hover:text-foreground transition-colors">
            Hola, <span className="font-medium text-foreground">{name}</span>
          </p>
        </Link>

        <Link
          href="/matches"
          className={cn(
            "flex h-12 w-full items-center justify-center rounded-md",
            "bg-primary px-4 text-base font-medium text-primary-foreground",
            "hover:bg-primary/90 transition-colors"
          )}
        >
          Ver partidos y predecir
        </Link>

        <Link
          href="/leagues"
          className={cn(
            "flex h-12 w-full items-center justify-center rounded-md",
            "border border-input px-4 text-base font-medium",
            "hover:bg-muted transition-colors"
          )}
        >
          Mis ligas
        </Link>

        <Link
          href="/rankings"
          className={cn(
            "flex h-12 w-full items-center justify-center rounded-md",
            "border border-input px-4 text-base font-medium",
            "hover:bg-muted transition-colors"
          )}
        >
          Rankings
        </Link>

        {isAdmin && (
          <Link
            href="/admin"
            className="flex items-center justify-center text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
          >
            ⚙ Admin
          </Link>
        )}
      </div>
    </main>
  );
}
