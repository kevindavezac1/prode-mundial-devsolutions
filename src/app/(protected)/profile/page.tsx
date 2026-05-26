import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProfileStats } from "@/components/profile/profile-stats";
import { EditDisplayName } from "@/components/profile/edit-display-name";

export const metadata: Metadata = { title: "Mi perfil" };

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url, total_points, exact_predictions, correct_predictions, total_predictions")
    .eq("id", user.id)
    .single();

  if (!profile) notFound();

  const { count: higherRanked } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .or(
      `total_points.gt.${profile.total_points},` +
      `and(total_points.eq.${profile.total_points},exact_predictions.gt.${profile.exact_predictions})`
    );

  const globalRank = (higherRanked ?? 0) + 1;

  return (
    <main className="min-h-screen pb-8">
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b px-4 py-3 flex items-center gap-3">
        <Link href="/dashboard" className="text-muted-foreground text-sm">‹ Volver</Link>
        <h1 className="font-bold text-lg">Mi perfil</h1>
      </header>

      <div className="p-4 space-y-6">
        {/* Avatar + identity */}
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-muted overflow-hidden shrink-0 flex items-center justify-center text-2xl font-bold">
            {profile.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.avatar_url} alt="avatar" className="w-full h-full object-cover" />
            ) : (
              profile.display_name[0]?.toUpperCase() ?? "?"
            )}
          </div>
          <div className="min-w-0">
            <p className="font-bold text-lg truncate">{profile.display_name}</p>
            <p className="text-xs text-muted-foreground">@{profile.username}</p>
          </div>
        </div>

        {/* Edit name */}
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Nombre visible</p>
          <EditDisplayName currentName={profile.display_name} />
        </div>

        {/* Stats */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Estadísticas</p>
          <ProfileStats
            totalPoints={profile.total_points}
            exactPredictions={profile.exact_predictions}
            correctPredictions={profile.correct_predictions}
            totalPredictions={profile.total_predictions}
            globalRank={globalRank}
          />
        </div>
      </div>
    </main>
  );
}
