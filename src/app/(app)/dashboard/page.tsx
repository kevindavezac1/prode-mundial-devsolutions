import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { DashboardFeed } from "@/components/dashboard/DashboardFeed";

export const metadata: Metadata = { title: "Partidos" };

/**
 * Server wrapper: fetches display_name so the client DashboardFeed
 * doesn't need an extra API round-trip for the greeting.
 * Auth is already enforced by (app)/layout.tsx.
 */
export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user!.id)
    .single();

  const displayName = profile?.display_name ?? "Jugador";

  return <DashboardFeed displayName={displayName} />;
}
