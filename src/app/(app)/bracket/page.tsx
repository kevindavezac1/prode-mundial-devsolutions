import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BracketView } from "@/components/bracket/BracketView";
import type { MatchWithTeams } from "@/types/matches";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Llaves — Prode Mundial 2026" };

export default async function BracketPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data } = await supabase
    .from("matches")
    .select(
      `id, match_number, phase, scheduled_at, venue, status,
       home_score, away_score, penalty_winner, home_slot, away_slot,
       home_team:teams!home_team_id(id, name, code, flag_url, group_name),
       away_team:teams!away_team_id(id, name, code, flag_url, group_name)`
    )
    .neq("phase", "group")
    .order("match_number");

  const matches = (data ?? []) as unknown as MatchWithTeams[];

  return (
    <main className="min-h-screen">
      <header
        className="sticky top-0 z-10 backdrop-blur px-4 py-3"
        style={{
          background: "rgba(7,9,15,0.95)",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        <h1 className="font-bold text-lg text-white">Llaves</h1>
        <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
          Fases eliminatorias · Mundial 2026
        </p>
      </header>

      <BracketView matches={matches} />
    </main>
  );
}
