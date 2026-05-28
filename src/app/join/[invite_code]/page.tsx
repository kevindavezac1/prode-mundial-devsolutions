import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { JoinLeagueClient } from "@/components/leagues/join-league-client";

function adminClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function generateMetadata({
  params,
}: {
  params: { invite_code: string };
}): Promise<Metadata> {
  const code = params.invite_code.trim().toUpperCase();
  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const OG_IMAGE = `${SITE_URL}/logo_mundial.webp`;

  const { data: league } = await adminClient()
    .from("leagues")
    .select("name")
    .eq("invite_code", code)
    .maybeSingle();

  const leagueName = league?.name;
  const ogTitle = leagueName
    ? `Te invitan a ${leagueName}`
    : "Prode Mundial 2026";
  const description =
    "Aceptá la invitación y predecí los partidos del Mundial 2026 con tus amigos";

  return {
    title: leagueName ? `Te invitan a ${leagueName}` : "Prode Mundial 2026",
    openGraph: {
      title: ogTitle,
      description,
      url: `${SITE_URL}/join/${params.invite_code}`,
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

export default async function JoinPage({
  params,
}: {
  params: { invite_code: string };
}) {
  const code = params.invite_code.trim().toUpperCase();

  // Buscar liga con admin client (el user aún no es miembro, RLS lo bloquearía)
  const admin = adminClient();
  const { data: league } = await admin
    .from("leagues")
    .select("id, name, max_members")
    .eq("invite_code", code)
    .maybeSingle();

  if (!league) {
    return (
      <main
        className="min-h-screen flex flex-col items-center justify-center p-6 max-w-sm mx-auto text-center gap-4"
        style={{ background: "#02040a" }}
      >
        <p className="text-3xl">❌</p>
        <h1 className="text-lg font-bold text-white">Código inválido</h1>
        <p className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>
          No existe una liga con ese código de invitación.
        </p>
        <Link href="/leagues" className="text-sm font-semibold" style={{ color: "#E4002B" }}>
          Ver mis ligas
        </Link>
      </main>
    );
  }

  // Cantidad de miembros
  const { count: memberCount } = await admin
    .from("league_members")
    .select("*", { count: "exact", head: true })
    .eq("league_id", league.id);

  // Verificar si el usuario está logueado
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Si está logueado, verificar si ya es miembro → redirigir directamente
  if (user) {
    const { data: existing } = await supabase
      .from("league_members")
      .select("user_id")
      .eq("league_id", league.id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (existing) {
      redirect(`/leagues/${league.id}`);
    }
  }

  return (
    <JoinLeagueClient
      league={{
        id: league.id,
        name: league.name,
        memberCount: memberCount ?? 0,
        maxMembers: league.max_members,
      }}
      inviteCode={code}
      isLoggedIn={!!user}
    />
  );
}
