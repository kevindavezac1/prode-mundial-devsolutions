import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import TopHeader from "@/components/layout/TopHeader";
import BottomNav from "@/components/layout/BottomNav";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Query total_points desde profiles
  const { data: profile } = await supabase
    .from("profiles")
    .select("total_points")
    .eq("id", user.id)
    .single();

  const userPoints = profile?.total_points ?? 0;

  return (
    <div className="min-h-screen pb-16" style={{ background: "#07090f" }}>
      <TopHeader userPoints={userPoints} />
      <main>{children}</main>
      <BottomNav />
    </div>
  );
}
