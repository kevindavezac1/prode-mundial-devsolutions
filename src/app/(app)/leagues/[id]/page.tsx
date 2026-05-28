import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { LeagueDetailView } from "@/components/leagues/league-detail";
import type { LeagueDetail, LeagueMember } from "@/types/leagues";

function adminClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const OG_IMAGE = `${SITE_URL}/logo_mundial.webp`;

  const { data: league } = await adminClient()
    .from("leagues")
    .select("name")
    .eq("id", params.id)
    .maybeSingle();

  const ogTitle = league
    ? `${league.name} — Prode Mundial 2026`
    : "Prode Mundial 2026";
  const description =
    "Unite a mi liga y competí conmigo en el Prode del Mundial 2026";

  return {
    title: league?.name ?? "Liga",
    openGraph: {
      title: ogTitle,
      description,
      url: `${SITE_URL}/leagues/${params.id}`,
      type: "website",
      images: [{ url: OG_IMAGE, width: 800, height: 800 }],
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description,
      images: [OG_IMAGE],
    },
  };
}

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
      <header
        className="sticky top-0 z-10 backdrop-blur px-4 py-3 flex items-center gap-3"
        style={{ background: "rgba(7,9,15,0.95)", borderBottom: "1px solid rgba(255,255,255,0.07)" }}
      >
        <Link href="/leagues" className="text-sm shrink-0" style={{ color: "rgba(255,255,255,0.5)" }}>‹ Volver</Link>
        <div className="min-w-0">
          <h1 className="font-bold text-lg truncate text-white">{league.name}</h1>
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{sorted.length} / {league.max_members} miembros</p>
        </div>
      </header>
      <div className="p-4">
        <LeagueDetailView league={leagueDetail} userId={user.id} />
      </div>
    </main>
  );
}
