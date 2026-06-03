import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { JoinLeagueByIdClient } from "@/components/leagues/join-league-by-id-client";

function adminClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function generateMetadata({
  params,
}: {
  params: { league_id: string };
}): Promise<Metadata> {
  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const OG_IMAGE = `${SITE_URL}/logo_mundial.webp`;

  const { data: league } = await adminClient()
    .from("leagues")
    .select("name")
    .eq("id", params.league_id)
    .maybeSingle();

  const leagueName = league?.name;
  const ogTitle = leagueName ? `Te invitan a ${leagueName}` : "Prode Mundial 2026";
  const description = "Aceptá la invitación y predecí los partidos del Mundial 2026 con tus amigos";

  return {
    title: ogTitle,
    openGraph: {
      title: ogTitle,
      description,
      url: `${SITE_URL}/join/liga/${params.league_id}`,
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

export default async function JoinByIdPage({
  params,
}: {
  params: { league_id: string };
}) {
  const leagueId = params.league_id;
  const admin = adminClient();

  const { data: league } = await admin
    .from("leagues")
    .select("id, name, max_members")
    .eq("id", leagueId)
    .maybeSingle();

  if (!league) {
    return (
      <main
        className="min-h-screen flex flex-col items-center justify-center p-6 max-w-sm mx-auto text-center gap-4"
        style={{ background: "#02040a" }}
      >
        <p className="text-3xl">❌</p>
        <h1 className="text-lg font-bold text-white">Liga no encontrada</h1>
        <p className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>
          Este link no corresponde a ninguna liga activa.
        </p>
        <Link href="/leagues" className="text-sm font-semibold" style={{ color: "#E4002B" }}>
          Ver mis ligas
        </Link>
      </main>
    );
  }

  const { count: memberCount } = await admin
    .from("league_members")
    .select("*", { count: "exact", head: true })
    .eq("league_id", leagueId);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    // Already a member → redirect directly
    const { data: existing } = await supabase
      .from("league_members")
      .select("user_id")
      .eq("league_id", leagueId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (existing) {
      redirect(`/leagues/${leagueId}`);
    }

    // Check ban (admin client — not a member yet, RLS would block)
    const { data: ban } = await admin
      .from("league_bans")
      .select("id")
      .eq("league_id", leagueId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (ban) {
      return (
        <main
          className="min-h-screen flex flex-col items-center justify-center p-6 max-w-sm mx-auto text-center gap-4"
          style={{ background: "#02040a" }}
        >
          <p className="text-3xl">🚫</p>
          <h1 className="text-lg font-bold text-white">No podés unirte a esta liga</h1>
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>
            Fuiste expulsado de esta liga por el administrador. No es posible volver a ingresar.
          </p>
          <Link href="/dashboard" className="text-sm font-semibold" style={{ color: "#E4002B" }}>
            Volver al inicio
          </Link>
        </main>
      );
    }
  }

  return (
    <JoinLeagueByIdClient
      league={{
        id: league.id,
        name: league.name,
        memberCount: memberCount ?? 0,
        maxMembers: league.max_members,
      }}
      isLoggedIn={!!user}
    />
  );
}
