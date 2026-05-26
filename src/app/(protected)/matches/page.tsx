import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MatchesList } from "@/components/matches/matches-list";
import type { MatchWithTeams } from "@/types/matches";

export const metadata: Metadata = { title: "Partidos" };

export default async function MatchesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: matches, error } = await supabase
    .from("matches")
    .select(`
      id, match_number, phase, scheduled_at, venue, status,
      home_score, away_score,
      home_team:teams!home_team_id(id, name, code, flag_url),
      away_team:teams!away_team_id(id, name, code, flag_url)
    `)
    .eq("phase", "group")
    .order("scheduled_at");

  if (error) {
    return (
      <main className="p-4">
        <p className="text-destructive text-sm">Error cargando partidos.</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen pb-8">
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b px-4 py-3">
        <h1 className="font-bold text-lg">Predicciones</h1>
        <p className="text-xs text-muted-foreground">Mundial 2026 — Fase de Grupos</p>
      </header>
      <MatchesList matches={matches as unknown as MatchWithTeams[]} />
    </main>
  );
}
