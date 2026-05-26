import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LeagueDetailView } from "@/components/leagues/league-detail";
import type { LeagueDetail, LeagueMember } from "@/types/leagues";

export const metadata: Metadata = { title: "Liga" };

export default async function LeaguePage({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: league, error } = await supabase
    .from("leagues")
    .select("id, name, invite_code, owner_id, max_members, is_public, created_at")
    .eq("id", params.id)
    .single();

  if (error || !league) notFound();

  const { data: members } = await supabase
    .from("league_members")
    .select("user_id, joined_at, profiles(display_name, avatar_url, total_points)")
    .eq("league_id", params.id);

  type MemberRow = {
    user_id: string;
    joined_at: string;
    profiles: { display_name: string; avatar_url: string | null; total_points: number } | null;
  };

  const sorted: LeagueMember[] = ((members ?? []) as unknown as MemberRow[])
    .map((m) => ({
      user_id: m.user_id,
      joined_at: m.joined_at,
      display_name: m.profiles?.display_name ?? "Usuario",
      avatar_url: m.profiles?.avatar_url ?? null,
      total_points: m.profiles?.total_points ?? 0,
    }))
    .sort((a, b) => b.total_points - a.total_points);

  const leagueDetail: LeagueDetail = { ...league, members: sorted };

  return (
    <main className="min-h-screen pb-8">
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b px-4 py-3 flex items-center gap-3">
        <Link href="/leagues" className="text-muted-foreground text-sm">‹ Volver</Link>
        <div className="min-w-0">
          <h1 className="font-bold text-lg truncate">{league.name}</h1>
          <p className="text-xs text-muted-foreground">{sorted.length} / {league.max_members} miembros</p>
        </div>
      </header>
      <div className="p-4">
        <LeagueDetailView league={leagueDetail} userId={user.id} />
      </div>
    </main>
  );
}
