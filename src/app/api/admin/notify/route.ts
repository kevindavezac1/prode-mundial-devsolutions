import { NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import webpush from "web-push";

webpush.setVapidDetails(
  process.env.VAPID_EMAIL!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

type SubscriptionRow = {
  user_id: string;
  subscription: webpush.PushSubscription;
};

export async function POST(request: Request) {
  const secret = request.headers.get("x-admin-secret");
  if (!secret || secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const { title, body: msgBody, url } = body;

  if (!title || !msgBody) {
    return NextResponse.json({ error: "title y body son requeridos." }, { status: 400 });
  }

  const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: subscribers, error } = await supabase
    .from("push_subscriptions")
    .select("user_id, subscription");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!subscribers || subscribers.length === 0) {
    return NextResponse.json({ ok: true, sent: 0 });
  }

  const payload = JSON.stringify({ title, body: msgBody, url: url ?? "/dashboard" });

  let sent = 0;
  const expired: string[] = [];

  for (const sub of subscribers as SubscriptionRow[]) {
    try {
      await webpush.sendNotification(sub.subscription, payload);
      sent++;
    } catch (err) {
      if ((err as { statusCode?: number }).statusCode === 410) {
        expired.push(sub.user_id);
      }
    }
  }

  // Clean up expired subscriptions
  if (expired.length > 0) {
    await supabase
      .from("push_subscriptions")
      .delete()
      .in("user_id", expired);
  }

  return NextResponse.json({ ok: true, sent, expired: expired.length });
}
