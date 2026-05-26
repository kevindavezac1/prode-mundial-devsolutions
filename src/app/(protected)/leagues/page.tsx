import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { MyLeagues } from "@/components/leagues/my-leagues";
import type { League } from "@/types/leagues";

export const metadata: Metadata = { title: "Mis ligas" };

export default async function LeaguesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: memberships } = await supabase
    .from("league_members")
    .select("league_id, leagues(id, name, invite_code, owner_id, max_members, is_public, created_at)")
    .eq("user_id", user.id);

  const leagues = ((memberships ?? []).map((m) => m.leagues).filter(Boolean)) as unknown as League[];

  const leagueIds = leagues.map((l) => l.id);
  const countMap: Record<string, number> = {};

  if (leagueIds.length > 0) {
    const { data: counts } = await supabase
      .from("league_members")
      .select("league_id")
      .in("league_id", leagueIds);
    for (const c of counts ?? []) {
      countMap[c.league_id] = (countMap[c.league_id] ?? 0) + 1;
    }
  }

  const leaguesWithCount = leagues.map((l) => ({ ...l, member_count: countMap[l.id] ?? 0 }));

  return (
    <main className="min-h-screen pb-8">
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b px-4 py-3 flex items-center gap-3">
        <Link href="/dashboard" className="text-muted-foreground text-sm">‹ Volver</Link>
        <h1 className="font-bold text-lg">Mis ligas</h1>
      </header>
      <div className="p-4">
        <MyLeagues leagues={leaguesWithCount} userId={user.id} />
      </div>
    </main>
  );
}
