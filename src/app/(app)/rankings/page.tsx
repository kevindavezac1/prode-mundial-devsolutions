import type { Metadata } from "next";
import Link from "next/link";
import { unstable_cache } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { RankingsTabs } from "@/components/rankings/rankings-tabs";
import type { RankingEntry, LeagueRankEntry } from "@/components/rankings/rankings-tabs";

type UserEntry = RankingEntry & { rank: number };

export const metadata: Metadata = { title: "Rankings" };

// Cached 30s — shared across all users
const getGlobalRankings = unstable_cache(
  async (): Promise<RankingEntry[]> => {
    const supabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { data } = await supabase
      .from("profiles")
      .select("id, username, display_name, avatar_url, total_points, exact_predictions, correct_predictions, total_predictions")
      .order("total_points", { ascending: false })
      .order("exact_predictions", { ascending: false })
      .limit(20);
    return (data ?? []) as RankingEntry[];
  },
  ["global-rankings"],
  { revalidate: 30, tags: ["global-rankings"] }
);

export default async function RankingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const [rankings, leagueRanks] = await Promise.all([
    getGlobalRankings(),
    getUserLeagueRanks(supabase, user.id),
  ]);

  let userEntry: UserEntry | undefined;
  if (!rankings.some((r) => r.id === user.id)) {
    const { data: userProfile } = await supabase
      .from("profiles")
      .select("id, username, display_name, avatar_url, total_points, exact_predictions, correct_predictions, total_predictions")
      .eq("id", user.id)
      .single();
    if (userProfile) {
      const { count: higherRanked } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .or(
          `total_points.gt.${userProfile.total_points},` +
          `and(total_points.eq.${userProfile.total_points},exact_predictions.gt.${userProfile.exact_predictions})`
        );
      userEntry = { ...(userProfile as RankingEntry), rank: (higherRanked ?? 0) + 1 };
    }
  }

  return (
    <main className="min-h-screen pb-8">
      <header
        className="sticky top-0 z-10 backdrop-blur px-4 py-3 flex items-center gap-3"
        style={{ background: "rgba(7,9,15,0.95)", borderBottom: "1px solid rgba(255,255,255,0.07)" }}
      >
        <Link href="/dashboard" className="text-sm shrink-0" style={{ color: "rgba(255,255,255,0.5)" }}>‹ Volver</Link>
        <div>
          <h1 className="font-bold text-lg text-white">Rankings</h1>
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>Top jugadores</p>
        </div>
      </header>
      <div className="p-4">
        <RankingsTabs rankings={rankings} leagueRanks={leagueRanks} userId={user.id} userEntry={userEntry} />
      </div>
    </main>
  );
}

async function getUserLeagueRanks(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
): Promise<LeagueRankEntry[]> {
  const { data: memberships } = await supabase
    .from("league_members")
    .select("league_id, leagues(id, name)")
    .eq("user_id", userId);

  if (!memberships || memberships.length === 0) return [];

  const leagueIds = memberships.map((m) => m.league_id);

  // Fetch all members for all user's leagues with their points
  const { data: allMembers } = await supabase
    .from("league_members")
    .select("league_id, user_id, profiles(total_points)")
    .in("league_id", leagueIds);

  type MemberRow = {
    league_id: string;
    user_id: string;
    profiles: { total_points: number } | null;
  };

  const rows = (allMembers ?? []) as unknown as MemberRow[];

  const result: LeagueRankEntry[] = memberships.map((m) => {
    const league = m.leagues as { id: string; name: string } | null;
    if (!league) return null;

    const leagueMembers = rows.filter((r) => r.league_id === m.league_id);
    const myRow = leagueMembers.find((r) => r.user_id === userId);
    const myPoints = myRow?.profiles?.total_points ?? 0;

    // Sort by points desc to compute position
    const sorted = [...leagueMembers].sort(
      (a, b) => (b.profiles?.total_points ?? 0) - (a.profiles?.total_points ?? 0)
    );
    const myPosition = sorted.findIndex((r) => r.user_id === userId) + 1;

    return {
      id: league.id,
      name: league.name,
      my_position: myPosition || leagueMembers.length,
      my_points: myPoints,
      member_count: leagueMembers.length,
    } satisfies LeagueRankEntry;
  }).filter(Boolean) as LeagueRankEntry[];

  return result;
}
