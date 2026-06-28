import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { AdminPanel } from "@/components/admin/admin-panel";
import type { MatchWithTeams } from "@/types/matches";
import type { Sponsor } from "@/components/admin/admin-panel";

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
      home_score, away_score, penalty_winner, phase, home_slot, away_slot,
      home_team:teams!home_team_id(id, name, code, flag_url),
      away_team:teams!away_team_id(id, name, code, flag_url)
    `)
    .order("scheduled_at");

  const { data: sponsors } = await supabase
    .from("sponsors")
    .select("id, nombre, logo_url, descripcion, link_url, activo, orden")
    .order("orden");

  return (
    <main className="min-h-screen pb-8">
      <header
        className="sticky top-0 z-10 backdrop-blur px-4 py-3 flex items-center gap-3"
        style={{ background: "rgba(7,9,15,0.95)", borderBottom: "1px solid rgba(255,255,255,0.07)" }}
      >
        <Link href="/dashboard" className="text-sm shrink-0" style={{ color: "rgba(255,255,255,0.5)" }}>‹ Volver</Link>
        <div>
          <h1 className="font-bold text-lg text-white">Admin · Resultados</h1>
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{user.email}</p>
        </div>
      </header>
      <div className="p-4">
        <AdminPanel
          matches={(matches ?? []) as unknown as MatchWithTeams[]}
          sponsors={(sponsors ?? []) as Sponsor[]}
        />
      </div>
    </main>
  );
}
