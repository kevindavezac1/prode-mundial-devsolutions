import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { createClient as createServiceClient } from "@supabase/supabase-js";

// API-Football status codes
const LIVE_STATUSES     = new Set(["1H", "2H", "HT", "ET", "BT", "P", "LIVE"]);
const FINISHED_STATUSES = new Set(["FT", "AET", "PEN"]);

type MatchRow = {
  id: number;
  api_football_id: number;
  status: string;
  home_score: number | null;
  away_score: number | null;
};

type SyncDetail = {
  match_id: number;
  api_id: number;
  action: string;
  result?: string;
};

export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  if (!auth || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const now = new Date();
  const windowStart = new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString();
  const windowEnd   = new Date(now.getTime() + 30 * 60 * 1000).toISOString();

  const { data: matches, error: fetchError } = await supabase
    .from("matches")
    .select("id, api_football_id, status, home_score, away_score")
    .in("status", ["scheduled", "live"])
    .not("api_football_id", "is", null)
    .gte("scheduled_at", windowStart)
    .lte("scheduled_at", windowEnd);

  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 });
  if (!matches || matches.length === 0) {
    return NextResponse.json({ ok: true, checked: 0, updated: 0, details: [] });
  }

  let updated = 0;
  const details: SyncDetail[] = [];

  for (const match of matches as MatchRow[]) {
    try {
      const res = await fetch(
        `${process.env.API_FOOTBALL_URL}/fixtures?id=${match.api_football_id}`,
        {
          headers: {
            "x-apisports-key": process.env.API_FOOTBALL_KEY!,
          },
          // No cache — always fetch live data
          cache: "no-store",
        }
      );

      if (!res.ok) {
        details.push({ match_id: match.id, api_id: match.api_football_id, action: `api_error_${res.status}` });
        continue;
      }

      const json = await res.json();
      const fixture = json.response?.[0];
      if (!fixture) {
        details.push({ match_id: match.id, api_id: match.api_football_id, action: "no_fixture" });
        continue;
      }

      const apiStatus  = fixture.fixture.status.short as string;
      const homeGoals  = fixture.goals.home  as number | null;
      const awayGoals  = fixture.goals.away  as number | null;

      if (FINISHED_STATUSES.has(apiStatus) && homeGoals !== null && awayGoals !== null) {
        await supabase
          .from("matches")
          .update({
            home_score:         homeGoals,
            away_score:         awayGoals,
            status:             "finished",
            result_updated_at:  new Date().toISOString(),
            result_source:      "api",
          })
          .eq("id", match.id);

        await supabase.from("result_audit_log").insert({
          match_id:      match.id,
          source:        "api",
          previous_home: match.home_score ?? null,
          previous_away: match.away_score ?? null,
          new_home:      homeGoals,
          new_away:      awayGoals,
        });

        await supabase.rpc("calculate_match_points", { p_match_id: match.id });

        details.push({
          match_id: match.id,
          api_id:   match.api_football_id,
          action:   "finished",
          result:   `${homeGoals}-${awayGoals}`,
        });
        updated++;

      } else if (LIVE_STATUSES.has(apiStatus) && match.status !== "live") {
        await supabase
          .from("matches")
          .update({ status: "live" })
          .eq("id", match.id);

        details.push({ match_id: match.id, api_id: match.api_football_id, action: "set_live" });

      } else {
        details.push({ match_id: match.id, api_id: match.api_football_id, action: apiStatus.toLowerCase() });
      }
    } catch (err) {
      details.push({
        match_id: match.id,
        api_id:   match.api_football_id,
        action:   "error",
        result:   err instanceof Error ? err.message : String(err),
      });
    }
  }

  if (updated > 0) {
    revalidateTag("global-rankings");
  }

  return NextResponse.json({
    ok:      true,
    checked: matches.length,
    updated,
    details,
  });
}
