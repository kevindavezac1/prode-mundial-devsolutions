import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProfileStats } from "@/components/profile/profile-stats";
import { EditDisplayName } from "@/components/profile/edit-display-name";
import { AvatarUpload } from "@/components/profile/avatar-upload";
import { logout } from "@/app/(app)/dashboard/actions";
import { getCurrentPeriod, getPeriodPoints } from "@/lib/period";
export const metadata: Metadata = { title: "Mi perfil" };

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: profile }, period] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, username, display_name, avatar_url, total_points, exact_predictions, correct_predictions, total_predictions")
      .eq("id", user.id)
      .single(),
    getCurrentPeriod(),
  ]);

  if (!profile) notFound();

  const [{ count: higherRanked }, periodPoints] = await Promise.all([
    supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .or(
        `total_points.gt.${profile.total_points},` +
        `and(total_points.eq.${profile.total_points},exact_predictions.gt.${profile.exact_predictions})`
      ),
    period ? getPeriodPoints(user.id, period) : Promise.resolve(null),
  ]);

  const globalRank = (higherRanked ?? 0) + 1;

  // Fix 2 — detectar admin por ADMIN_EMAILS env var (mismo check que assertAdmin())
  const adminEmails = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase());
  const isAdmin = user.email ? adminEmails.includes(user.email.toLowerCase()) : false;

  return (
    <main className="min-h-screen pb-8">
      <header
        className="sticky top-0 z-10 backdrop-blur px-4 py-3 flex items-center gap-3"
        style={{ background: "rgba(7,9,15,0.95)", borderBottom: "1px solid rgba(255,255,255,0.07)" }}
      >
        <Link href="/dashboard" className="text-sm shrink-0" style={{ color: "rgba(255,255,255,0.5)" }}>‹ Volver</Link>
        <h1 className="font-bold text-lg text-white">Mi perfil</h1>
      </header>

      <div className="p-4 space-y-6">
        {/* Avatar + identity */}
        <div className="flex items-center gap-4">
          <AvatarUpload
            userId={profile.id}
            displayName={profile.display_name}
            currentAvatarUrl={profile.avatar_url}
          />
          <div className="min-w-0">
            <p className="font-bold text-lg truncate text-white">{profile.display_name}</p>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>@{profile.username}</p>
          </div>
        </div>

        {/* Edit name */}
        <div className="space-y-1.5">
          <p className="text-[10px] font-bold uppercase" style={{ color: "rgba(255,255,255,0.35)", letterSpacing: "2px" }}>Nombre visible</p>
          <EditDisplayName currentName={profile.display_name} />
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
            periodLabel={period?.label}
            periodPoints={periodPoints ?? undefined}
          />
        </div>

        {/* Fix 2 — Link admin (solo si es admin) */}
        {isAdmin && (
          <Link
            href="/admin"
            className="flex items-center gap-2 text-xs font-semibold"
            style={{ color: "rgba(255,255,255,0.35)" }}
          >
            <span>⚙️</span> Panel de administración
          </Link>
        )}

        {/* Fix 1 — Logout */}
        <div
          className="pt-2"
          style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
        >
          <form action={logout}>
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all active:scale-[0.98]"
              style={{
                color: "#E4002B",
                border: "1px solid rgba(228,0,43,0.3)",
                background: "rgba(228,0,43,0.04)",
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Cerrar sesión
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
