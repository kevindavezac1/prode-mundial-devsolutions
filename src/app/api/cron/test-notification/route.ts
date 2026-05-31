import { NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import webpush from "web-push";
import { Resend } from "resend";

webpush.setVapidDetails(
  process.env.VAPID_EMAIL!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

const resend = new Resend(process.env.RESEND_API_KEY);

const TEST_EMAIL = "devsolutionarg@gmail.com";

export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  if (!auth || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Find user by email
  const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();
  if (usersError) {
    return NextResponse.json({ error: usersError.message }, { status: 500 });
  }

  const targetUser = users.find((u) => u.email === TEST_EMAIL);
  if (!targetUser) {
    return NextResponse.json({ error: `Usuario ${TEST_EMAIL} no encontrado.` }, { status: 404 });
  }

  const results: Record<string, string> = {};

  // Push notification
  const { data: subs } = await supabase
    .from("push_subscriptions")
    .select("subscription")
    .eq("user_id", targetUser.id);

  if (!subs || subs.length === 0) {
    results.push = "sin suscripción activa";
  } else {
    const payload = JSON.stringify({
      title: "🧪 Test Prode Mundial 2026",
      body: "Las notificaciones están funcionando ✓",
      url: "/dashboard",
    });

    for (const sub of subs) {
      try {
        await webpush.sendNotification(
          sub.subscription as webpush.PushSubscription,
          payload
        );
        results.push = "ok";
      } catch (err) {
        results.push = `error: ${err instanceof Error ? err.message : String(err)}`;
      }
    }
  }

  // Email — deshabilitado hasta tener dominio verificado en Resend
  // try {
  //   const { data: emailData, error: emailError } = await resend.emails.send({
  //     from: "Prode 2026 <notificaciones@prode2026.app>",
  //     to: TEST_EMAIL,
  //     subject: "🧪 Test - Prode Mundial 2026",
  //     html: `
  //       <div style="font-family:sans-serif;max-width:480px;margin:0 auto;background:#080d1a;color:#fff;padding:24px;border-radius:12px">
  //         <h2 style="margin-top:0">🧪 Test - Prode Mundial 2026</h2>
  //         <p>Las notificaciones por email funcionan correctamente.</p>
  //         <p style="margin-top:24px;font-size:12px;color:rgba(255,255,255,0.4)">
  //           Prode Mundial 2026
  //         </p>
  //       </div>
  //     `,
  //   });
  //   if (emailError) {
  //     results.email = `error: ${emailError.message}`;
  //   } else {
  //     results.email = `ok: ${emailData?.id}`;
  //   }
  // } catch (err) {
  //   results.email = `error: ${err instanceof Error ? err.message : String(err)}`;
  // }
  results.email = "deshabilitado";

  return NextResponse.json({ ok: true, results });
}
