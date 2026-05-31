import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/supabase/auth";

export async function POST(request: Request) {
  const { user, supabase } = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const { subscription } = body;

  if (!subscription?.endpoint) {
    return NextResponse.json({ error: "Suscripción inválida." }, { status: 400 });
  }

  console.log("[push/subscribe] user:", user.id, "endpoint:", subscription.endpoint);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("push_subscriptions")
    .upsert(
      { user_id: user.id, subscription },
      { onConflict: "user_id" }
    );

  if (error) {
    console.error("[push/subscribe] upsert error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  console.log("[push/subscribe] saved ok for user:", user.id);

  return NextResponse.json({ ok: true });
}
