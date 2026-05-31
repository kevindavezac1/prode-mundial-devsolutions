import { NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import webpush from "web-push";
// import { Resend } from "resend"; // deshabilitado hasta tener dominio verificado

webpush.setVapidDetails(
  process.env.VAPID_EMAIL!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

// const resend = new Resend(process.env.RESEND_API_KEY);

type MatchRow = {
  id: number;
  scheduled_at: string;
  home_team: { name: string };
  away_team: { name: string };
};

type SubscriptionRow = {
  user_id: string;
  subscription: webpush.PushSubscription;
};

export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  if (!auth || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const now = new Date();
  const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);

  // 1. Matches starting in next 60 min
  const { data: upcomingMatches, error: matchError } = await supabase
    .from("matches")
    .select(
      "id, scheduled_at, home_team:teams!home_team_id(name), away_team:teams!away_team_id(name)"
    )
    .eq("status", "scheduled")
    .gte("scheduled_at", now.toISOString())
    .lte("scheduled_at", oneHourLater.toISOString());

  if (matchError) {
    return NextResponse.json({ error: matchError.message }, { status: 500 });
  }
  if (!upcomingMatches || upcomingMatches.length === 0) {
    return NextResponse.json({ ok: true, notified: 0 });
  }

  const matchIds = upcomingMatches.map((m) => m.id);

  // 2. Which users already have predictions for these matches
  const { data: existingPredictions } = await supabase
    .from("predictions")
    .select("user_id, match_id")
    .in("match_id", matchIds);

  const predictedSet = new Set(
    (existingPredictions ?? []).map((p) => `${p.user_id}:${p.match_id}`)
  );

  // 3. All active push subscriptions
  const { data: subscribers } = await supabase
    .from("push_subscriptions")
    .select("user_id, subscription");

  if (!subscribers || subscribers.length === 0) {
    return NextResponse.json({ ok: true, notified: 0 });
  }

  // 4. Per user: collect unpredicted matches and send one notification
  let notified = 0;
  const matches = upcomingMatches as unknown as MatchRow[];
  const subs = subscribers as SubscriptionRow[];

  for (const sub of subs) {
    const unpredicted = matches.filter(
      (m) => !predictedSet.has(`${sub.user_id}:${m.id}`)
    );
    if (unpredicted.length === 0) continue;

    const firstMatch = unpredicted[0];
    const matchLabel =
      unpredicted.length === 1
        ? `${firstMatch.home_team.name} vs ${firstMatch.away_team.name}`
        : `${unpredicted.length} partidos`;

    const payload = JSON.stringify({
      title: "⚽ Partido en menos de 1 hora",
      body: `${matchLabel} · Todavía no predijiste`,
      url: "/dashboard",
    });

    // Push notification
    try {
      await webpush.sendNotification(sub.subscription, payload);
    } catch (err) {
      // Subscription expired — remove it
      if ((err as { statusCode?: number }).statusCode === 410) {
        await supabase
          .from("push_subscriptions")
          .delete()
          .eq("user_id", sub.user_id);
      }
    }

    // Email — deshabilitado hasta tener dominio verificado en Resend
    // try {
    //   const {
    //     data: { user },
    //   } = await supabase.auth.admin.getUserById(sub.user_id);
    //
    //   if (user?.email) {
    //     const matchListHtml = unpredicted
    //       .map(
    //         (m) =>
    //           `<li style="margin-bottom:4px">${m.home_team.name} vs ${m.away_team.name}</li>`
    //       )
    //       .join("");
    //
    //     await resend.emails.send({
    //       from: "Prode 2026 <notificaciones@prode2026.app>",
    //       to: user.email,
    //       subject: "⚽ Partidos por empezar — ¡Todavía podés predecir!",
    //       html: `
    //         <div style="font-family:sans-serif;max-width:480px;margin:0 auto;background:#080d1a;color:#fff;padding:24px;border-radius:12px">
    //           <h2 style="margin-top:0">⚽ Partidos en menos de 1 hora</h2>
    //           <p>Todavía no predijiste estos partidos:</p>
    //           <ul style="padding-left:20px">${matchListHtml}</ul>
    //           <a href="https://prode2026.app/dashboard"
    //              style="display:inline-block;margin-top:16px;background:#e63946;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:bold">
    //             Ir a predecir
    //           </a>
    //           <p style="margin-top:24px;font-size:12px;color:rgba(255,255,255,0.4)">
    //             Prode Mundial 2026
    //           </p>
    //         </div>
    //       `,
    //     });
    //   }
    // } catch {
    //   // Email failure is non-fatal
    // }

    notified++;
  }

  return NextResponse.json({ ok: true, notified });
}
