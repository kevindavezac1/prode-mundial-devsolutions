import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProfileStats } from "@/components/profile/profile-stats";
import { PredictionHistory } from "@/components/profile/prediction-history";

export const metadata: Metadata = { title: "Perfil" };

export default async function PublicProfilePage({
  params,
  searchParams,
}: {
  params: { username: string };
  searchParams?: { from?: string };
}) {
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url, total_points, exact_predictions, correct_predictions, total_predictions")
    .eq("username", params.username)
    .single();

  if (!profile) notFound();

  const [rankResult, predictionsResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .or(
        `total_points.gt.${profile.total_points},` +
        `and(total_points.eq.${profile.total_points},exact_predictions.gt.${profile.exact_predictions})`
      ),
    supabase
      .from("predictions")
      .select(`
        id, home_score, away_score, outcome, points_earned,
        matches(
          id, scheduled_at, home_score, away_score,
          home_team:teams!home_team_id(name, code, flag_url),
          away_team:teams!away_team_id(name, code, flag_url)
        )
      `)
      .eq("user_id", profile.id)
      .neq("outcome", "pending")
      .order("match_id", { ascending: false }),
  ]);

  const globalRank = (rankResult.count ?? 0) + 1;

  return (
    <main className="min-h-screen pb-8">
      <header
        className="sticky top-0 z-10 backdrop-blur px-4 py-3 flex items-center gap-3"
        style={{ background: "rgba(7,9,15,0.95)", borderBottom: "1px solid rgba(255,255,255,0.07)" }}
      >
        <Link
          href={searchParams?.from ?? "/rankings"}
          className="text-sm shrink-0"
          style={{ color: "rgba(255,255,255,0.5)" }}
        >
          {searchParams?.from?.startsWith("/leagues/") ? "‹ Liga" : "‹ Rankings"}
        </Link>
        <h1 className="font-bold text-lg truncate text-white">{profile.display_name}</h1>
      </header>

      <div className="p-4 space-y-6">
        {/* Avatar + identity */}
        <div className="flex items-center gap-4">
          <div
            className="w-16 h-16 rounded-full overflow-hidden shrink-0 flex items-center justify-center text-2xl font-bold text-white"
            style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}
          >
            {profile.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.avatar_url} alt="avatar" className="w-full h-full object-cover" />
            ) : (
              profile.display_name[0]?.toUpperCase() ?? "?"
            )}
          </div>
          <div className="min-w-0">
            <p className="font-bold text-lg truncate text-white">{profile.display_name}</p>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>@{profile.username}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="space-y-2">
          <p className="text-[10px] font-bold uppercase" style={{ color: "rgba(255,255,255,0.35)", letterSpacing: "2px" }}>Estadísticas</p>
          <ProfileStats
            totalPoints={profile.total_points}
            exactPredictions={profile.exact_predictions}
            correctPredictions={profile.correct_predictions}
            totalPredictions={profile.total_predictions}
            globalRank={globalRank}
          />
        </div>

        {/* Prediction history — only finished matches are returned by RLS */}
        <div className="space-y-2">
          <p className="text-[10px] font-bold uppercase" style={{ color: "rgba(255,255,255,0.35)", letterSpacing: "2px" }}>
            Predicciones (partidos finalizados)
          </p>
          <PredictionHistory predictions={(predictionsResult.data ?? []) as Parameters<typeof PredictionHistory>[0]["predictions"]} />
        </div>
      </div>
    </main>
  );
}
