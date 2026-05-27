"use client";

import { useTransition } from "react";
import Link from "next/link";
import { loginWithGoogle } from "@/app/(auth)/login/actions";

const steps = [
  {
    n: "01",
    title: "Predecí cada partido",
    desc: "Ingresá el marcador que creés que va a quedar antes de que empiece.",
  },
  {
    n: "02",
    title: "Sumá puntos por aciertos",
    desc: "Exacto = 3 pts · Ganador correcto = 1 pt. Cada predicción cuenta.",
  },
  {
    n: "03",
    title: "Competí con tus amigos",
    desc: "Creá una liga privada, compartí el link y mirá quién la rompe.",
  },
];

export function LandingPage() {
  const [isPending, startTransition] = useTransition();

  function handleGoogle() {
    startTransition(async () => {
      await loginWithGoogle();
    });
  }

  return (
    <main className="min-h-screen text-white overflow-x-hidden" style={{ background: "#02040a" }}>

      {/* ── HERO ────────────────────────────────────────── */}
      <div className="relative min-h-screen flex flex-col">

        {/* Capa 2 — Logo Mundial decorativo */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://upload.wikimedia.org/wikipedia/en/thumb/5/5c/2026_FIFA_World_Cup_emblem.svg/1200px-2026_FIFA_World_Cup_emblem.svg.png"
          alt=""
          aria-hidden="true"
          style={{
            position: "absolute",
            bottom: "-40px",
            right: "-60px",
            width: "340px",
            opacity: 0.12,
            filter: "saturate(0.6)",
            pointerEvents: "none",
            userSelect: "none",
          }}
        />

        {/* Capa 3 — Tinte celeste argentino */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "radial-gradient(ellipse at top left, rgba(116,172,223,0.12) 0%, transparent 60%)",
            pointerEvents: "none",
          }}
        />

        {/* Capa 4 — Gradiente de profundidad */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(to bottom, transparent 0%, rgba(2,4,10,0.3) 50%, #02040a 100%)",
            pointerEvents: "none",
          }}
        />

        {/* Capa 5 — Contenido */}
        <div className="relative z-10 flex flex-col flex-1">

          {/* Top bar */}
          <div className="px-5 pt-6 flex justify-between items-center">
            <span
              className="font-display text-sm text-white"
              style={{ letterSpacing: "2px" }}
            >
              PRODE MUNDIAL 2026
            </span>
            <Link
              href="/login"
              className="text-[11px] font-bold rounded-full px-3 py-1.5"
              style={{
                color: "rgba(255,255,255,0.5)",
                border: "1px solid rgba(255,255,255,0.15)",
                letterSpacing: "1px",
              }}
            >
              INGRESAR
            </Link>
          </div>

          {/* Central — mobile: columna, desktop: dos columnas */}
          <div className="px-6 pt-8 pb-0 flex-1 flex flex-col md:flex-row md:items-center md:gap-10 md:pt-16">

            {/* RIGHT (trofeo) — primero en DOM para mobile order-first */}
            <div className="order-first md:order-last md:w-2/5 flex items-center justify-center mb-6 md:mb-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo_mundial.webp"
                alt="Copa del Mundo FIFA"
                className="object-contain h-[150px] md:h-[220px] w-auto"
                style={{
                  mixBlendMode: "multiply",
                  filter: "drop-shadow(0 0 24px rgba(212,175,55,0.35)) drop-shadow(0 4px 12px rgba(0,0,0,0.5))",
                }}
              />
            </div>

            {/* LEFT: texto */}
            <div className="md:w-3/5">
              {/* Franja argentina */}
              <div
                className="rounded-full mb-6"
                style={{
                  width: "64px",
                  height: "3px",
                  background: "linear-gradient(90deg, #74ACDF, white, #74ACDF)",
                }}
              />

              {/* Label */}
              <p
                className="font-bold mb-4"
                style={{ fontSize: "10px", color: "#74ACDF", letterSpacing: "3px" }}
              >
                MUNDIAL 2026 · USA · MÉXICO · CANADÁ
              </p>

              {/* Título */}
              <div
                className="font-display mb-5"
                style={{ fontSize: "62px", lineHeight: 0.88 }}
              >
                <div style={{ color: "white" }}>GANALE A</div>
                <div style={{ color: "#74ACDF" }}>TUS AMIGOS.</div>
                <div style={{ color: "white" }}>PARTIDO A</div>
                <div style={{ color: "#74ACDF" }}>PARTIDO.</div>
              </div>

              {/* Subtítulo */}
              <p
                className="text-sm leading-relaxed mb-6 md:mb-0"
                style={{ color: "rgba(255,255,255,0.5)", maxWidth: "280px" }}
              >
                Predecí los 104 partidos. Creá tu liga. Demostrá que sabés más que todos.
              </p>
            </div>

          </div>

          {/* CTA zone */}
          <div className="px-6 pb-12">

            {/* Botón Google */}
            <button
              onClick={handleGoogle}
              disabled={isPending}
              className="w-full flex items-center justify-center gap-3 rounded-xl font-bold text-sm text-white transition-all active:scale-[0.97] disabled:opacity-70"
              style={{
                height: "52px",
                background: "linear-gradient(135deg, #E4002B 0%, #B8001F 100%)",
                boxShadow: "0 4px 24px rgba(228,0,43,0.35)",
                letterSpacing: "1.5px",
              }}
            >
              {isPending ? (
                "REDIRIGIENDO..."
              ) : (
                <>
                  <GoogleIcon />
                  ENTRAR CON GOOGLE
                </>
              )}
            </button>

            {/* Link email */}
            <p className="mt-3 text-[11px] text-center block" style={{ color: "rgba(255,255,255,0.35)" }}>
              También podés{" "}
              <Link
                href="/login"
                className="underline underline-offset-2"
                style={{ color: "rgba(255,255,255,0.6)" }}
              >
                Iniciá sesión con email
              </Link>
            </p>

            {/* Social proof */}
            <div className="mt-6 flex items-center gap-2">
              <div className="flex items-center">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center"
                  style={{
                    background: "#74ACDF",
                    border: "2px solid #02040a",
                    fontSize: "9px",
                    fontWeight: 900,
                    color: "#02040a",
                  }}
                >
                  M
                </div>
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center -ml-2"
                  style={{
                    background: "#E4002B",
                    border: "2px solid #02040a",
                    fontSize: "9px",
                    fontWeight: 900,
                    color: "white",
                  }}
                >
                  J
                </div>
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center -ml-2"
                  style={{
                    background: "#D4AF37",
                    border: "2px solid #02040a",
                    fontSize: "9px",
                    fontWeight: 900,
                    color: "#02040a",
                  }}
                >
                  P
                </div>
              </div>
              <p className="text-[10px] ml-2" style={{ color: "rgba(255,255,255,0.3)" }}>
                +1.200 jugadores ya adentro
              </p>
            </div>

          </div>
        </div>
      </div>

      {/* ── CÓMO FUNCIONA ───────────────────────────────── */}
      <div className="px-6 py-10" style={{ background: "#02040a" }}>

        <div className="mb-8" style={{ height: "1px", background: "rgba(255,255,255,0.06)" }} />

        <p
          className="font-bold text-center mb-6"
          style={{ fontSize: "10px", color: "rgba(255,255,255,0.2)", letterSpacing: "3px" }}
        >
          CÓMO FUNCIONA
        </p>

        <div className="space-y-3">
          {steps.map((step) => (
            <div
              key={step.n}
              className="rounded-2xl p-4 flex gap-4 items-start"
              style={{
                background: "linear-gradient(160deg, #0d1120 0%, #07090f 100%)",
                border: "1px solid rgba(255,255,255,0.07)",
              }}
            >
              <span
                className="font-display leading-none shrink-0"
                style={{ fontSize: "40px", color: "rgba(116,172,223,0.2)", width: "40px" }}
              >
                {step.n}
              </span>
              <div>
                <p className="font-bold text-sm text-white mb-0.5">{step.title}</p>
                <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.4)" }}>
                  {step.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        <p
          className="mt-10 text-center"
          style={{ fontSize: "10px", color: "rgba(255,255,255,0.18)", letterSpacing: "1px" }}
        >
          Gratis · Sin publicidad · 48 equipos · 104 partidos
        </p>

      </div>
    </main>
  );
}

function GoogleIcon() {
  return (
    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}
