import type { Metadata } from "next";
import { unstable_cache } from "next/cache";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { StandingsView, type GroupStanding, type TeamStanding } from "@/components/standings/standings-view";

export const metadata: Metadata = { title: "Grupos" };

type TeamRow = Database["public"]["Tables"]["teams"]["Row"];
type MatchRow = Database["public"]["Tables"]["matches"]["Row"];

type StatsMap = Record<number, {
  team_id: number;
  name: string;
  code: string;
  flag_url: string | null;
  pj: number; g: number; e: number; p: number;
  gf: number; gc: number; dg: number; pts: number;
  tied: boolean;
}>;

function computeStats(teams: TeamRow[], matches: MatchRow[]): StatsMap {
  const stats: StatsMap = {};

  for (const t of teams) {
    stats[t.id] = {
      team_id: t.id,
      name: t.name,
      code: t.code,
      flag_url: t.flag_url,
      pj: 0, g: 0, e: 0, p: 0,
      gf: 0, gc: 0, dg: 0, pts: 0,
      tied: false,
    };
  }

  for (const m of matches) {
    if (m.status !== "finished") continue;
    if (m.home_team_id == null || m.away_team_id == null) continue;
    if (m.home_score == null || m.away_score == null) continue;

    const home = stats[m.home_team_id];
    const away = stats[m.away_team_id];
    if (!home || !away) continue;

    home.pj++; away.pj++;
    home.gf += m.home_score; home.gc += m.away_score;
    away.gf += m.away_score; away.gc += m.home_score;

    if (m.home_score > m.away_score) {
      home.g++; home.pts += 3;
      away.p++;
    } else if (m.home_score < m.away_score) {
      away.g++; away.pts += 3;
      home.p++;
    } else {
      home.e++; home.pts += 1;
      away.e++; away.pts += 1;
    }

    home.dg = home.gf - home.gc;
    away.dg = away.gf - away.gc;
  }

  return stats;
}

function applyHeadToHead(
  sorted: TeamStanding[],
  matches: MatchRow[]
): TeamStanding[] {
  const result: TeamStanding[] = [];
  let i = 0;

  while (i < sorted.length) {
    let j = i + 1;
    while (
      j < sorted.length &&
      sorted[j].pts === sorted[i].pts &&
      sorted[j].dg === sorted[i].dg &&
      sorted[j].gf === sorted[i].gf
    ) {
      j++;
    }

    const cluster = sorted.slice(i, j);

    if (cluster.length === 1) {
      result.push(cluster[0]);
    } else if (cluster.length === 2) {
      const [a, b] = cluster;
      const h2h = matches.find(
        (m) =>
          m.status === "finished" &&
          ((m.home_team_id === a.team_id && m.away_team_id === b.team_id) ||
            (m.home_team_id === b.team_id && m.away_team_id === a.team_id))
      );

      if (!h2h || h2h.home_score == null || h2h.away_score == null) {
        result.push(...cluster);
      } else {
        const aIsHome = h2h.home_team_id === a.team_id;
        const aScore = aIsHome ? h2h.home_score : h2h.away_score;
        const bScore = aIsHome ? h2h.away_score : h2h.home_score;

        if (aScore > bScore) {
          result.push(a, b);
        } else if (bScore > aScore) {
          result.push(b, a);
        } else {
          result.push({ ...a, tied: true }, { ...b, tied: true });
        }
      }
    } else {
      result.push(...cluster.map((t) => ({ ...t, tied: true })));
    }

    i = j;
  }

  return result;
}

const getStandings = unstable_cache(
  async (): Promise<GroupStanding[]> => {
    const supabase = createServiceClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const [{ data: teams }, { data: matches }] = await Promise.all([
      supabase
        .from("teams")
        .select("id, name, code, flag_url, group_name")
        .not("group_name", "is", null)
        .order("name"),
      supabase
        .from("matches")
        .select("id, home_team_id, away_team_id, home_score, away_score, status, phase")
        .eq("phase", "group"),
    ]);

    if (!teams || teams.length === 0) return [];

    const allMatches: MatchRow[] = (matches ?? []) as MatchRow[];
    const stats = computeStats(teams as TeamRow[], allMatches);

    // Group teams by group_name
    const grouped: Record<string, TeamRow[]> = {};
    for (const t of teams as TeamRow[]) {
      const g = t.group_name!;
      if (!grouped[g]) grouped[g] = [];
      grouped[g].push(t);
    }

    return Object.entries(grouped)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([group, groupTeams]) => {
        const teamStats: TeamStanding[] = groupTeams.map((t) => ({ ...stats[t.id] }));

        // Primary sort: pts desc, dg desc, gf desc, name asc
        teamStats.sort(
          (a, b) =>
            b.pts - a.pts ||
            b.dg - a.dg ||
            b.gf - a.gf ||
            a.name.localeCompare(b.name)
        );

        const resolved = applyHeadToHead(teamStats, allMatches);
        return { group, teams: resolved };
      });
  },
  ["group-standings"],
  { revalidate: 60, tags: ["group-standings"] }
);

export default async function StandingsPage() {
  const groups = await getStandings();

  return (
    <main className="min-h-screen pb-8">
      <header
        className="sticky top-0 z-10 backdrop-blur px-4 py-3"
        style={{
          background: "rgba(7,9,15,0.95)",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        <h1 className="font-bold text-lg text-white">Grupos</h1>
        <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
          Tabla de posiciones · {groups.length} grupos
        </p>
      </header>

      <StandingsView groups={groups} />
    </main>
  );
}
