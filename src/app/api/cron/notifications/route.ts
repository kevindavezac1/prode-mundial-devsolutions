// Push + email notifications — deshabilitado hasta implementar correctamente
// Reactivar cuando: dominio verificado en Resend, push subscriptions funcionando
//
// import { NextResponse } from "next/server";
// import { createClient as createServiceClient } from "@supabase/supabase-js";
// import webpush from "web-push";
// import { Resend } from "resend";
//
// ... ver historial de git para el código completo

import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  if (!auth || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }
  return NextResponse.json({ ok: true, notified: 0, status: "deshabilitado" });
}
