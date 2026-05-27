import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

function adminClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export default async function JoinPage({
  params,
}: {
  params: { invite_code: string };
}) {
  const code = params.invite_code.toUpperCase();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    const leagueRes = await adminClient()
      .from("leagues")
      .select("name")
      .eq("invite_code", code)
      .maybeSingle();

    const leagueName = leagueRes.data?.name;

    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-6 max-w-sm mx-auto text-center gap-4">
        <div className="space-y-2">
          <p className="text-2xl">⚽</p>
          <h1 className="text-xl font-bold text-white">Unirte a liga</h1>
          {leagueName ? (
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>
              Te invitaron a <span className="font-semibold text-white">{leagueName}</span>
            </p>
          ) : (
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>Código: {code}</p>
          )}
        </div>
        <Link
          href={`/login?redirect=/join/${code}`}
          className="flex h-12 w-full items-center justify-center rounded-xl px-4 text-base font-semibold text-white transition-all active:scale-[0.98]"
          style={{
            background: "linear-gradient(135deg, #E4002B 0%, #B8001F 100%)",
            boxShadow: "0 4px 16px rgba(228,0,43,0.25)",
          }}
        >
          Iniciar sesión para unirme
        </Link>
        <Link href="/register" className="text-sm hover:underline" style={{ color: "rgba(255,255,255,0.5)" }}>
          ¿No tenés cuenta? Registrate
        </Link>
      </main>
    );
  }

  // Logged in — find league and join (admin client: user not yet a member, RLS would block)
  const { data: league } = await adminClient()
    .from("leagues")
    .select("id, invite_code, max_members")
    .eq("invite_code", code)
    .maybeSingle();

  if (!league) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-6 max-w-sm mx-auto text-center gap-4">
        <p className="text-xl">❌</p>
        <h1 className="text-lg font-bold text-white">Código inválido</h1>
        <p className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>No existe una liga con ese código.</p>
        <Link href="/leagues" className="text-sm font-semibold" style={{ color: "#E4002B" }}>Ver mis ligas</Link>
      </main>
    );
  }

  // Already a member?
  const { data: existing } = await supabase
    .from("league_members")
    .select("user_id")
    .eq("league_id", league.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!existing) {
    const { count } = await supabase
      .from("league_members")
      .select("*", { count: "exact", head: true })
      .eq("league_id", league.id);

    if ((count ?? 0) < league.max_members) {
      await supabase.from("league_members").insert({ league_id: league.id, user_id: user.id });
    }
  }

  redirect(`/leagues/${league.id}`);
}
