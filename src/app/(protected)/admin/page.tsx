import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminPanel } from "@/components/admin/admin-panel";
import type { MatchWithTeams } from "@/types/matches";

export const metadata: Metadata = { title: "Admin" };

async function isAdmin(email: string): Promise<boolean> {
  const allowed = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase());
  return allowed.includes(email.toLowerCase());
}

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user?.email || !(await isAdmin(user.email))) {
    redirect("/dashboard");
  }

  const { data: matches } = await supabase
    .from("matches")
    .select(`
      id, match_number, phase, scheduled_at, venue, status,
      home_score, away_score,
      home_team:teams!home_team_id(id, name, code, flag_url),
      away_team:teams!away_team_id(id, name, code, flag_url)
    `)
    .order("scheduled_at");

  return (
    <main className="min-h-screen pb-8">
      <header
        className="sticky top-0 z-10 backdrop-blur px-4 py-3"
        style={{ background: "rgba(7,9,15,0.95)", borderBottom: "1px solid rgba(255,255,255,0.07)" }}
      >
        <h1 className="font-bold text-lg text-white">Admin · Resultados</h1>
        <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{user.email}</p>
      </header>
      <div className="p-4">
        <AdminPanel matches={(matches ?? []) as unknown as MatchWithTeams[]} />
      </div>
    </main>
  );
}
