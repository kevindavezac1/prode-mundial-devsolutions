"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { loginWithGoogle } from "@/app/(auth)/login/actions";

type LeagueInfo = {
  id: string;
  name: string;
  memberCount: number;
  maxMembers: number;
};

type Props = {
  league: LeagueInfo;
  inviteCode: string;
  isLoggedIn: boolean;
};

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

function LeagueCard({ league }: { league: LeagueInfo }) {
  return (
    <div
      className="rounded-2xl p-5 space-y-3 w-full"
      style={{
        background: "linear-gradient(160deg, #0d1120 0%, #07090f 100%)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <div
        className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl font-bold"
        style={{ background: "rgba(228,0,43,0.15)", border: "1px solid rgba(228,0,43,0.2)" }}
      >
        ⚽
      </div>
      <div>
        <p className="text-[10px] font-bold mb-1" style={{ color: "rgba(255,255,255,0.3)", letterSpacing: "2px" }}>
          INVITACIÓN A LIGA
        </p>
        <h1 className="text-xl font-bold text-white">{league.name}</h1>
      </div>
      <p className="text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>
        {league.memberCount} de {league.maxMembers} miembros
      </p>
    </div>
  );
}

export function JoinLeagueClient({ league, inviteCode, isLoggedIn }: Props) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleJoin() {
    setError(null);
    startTransition(async () => {
      const res = await fetch("/api/leagues/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invite_code: inviteCode }),
      });
      const body = await res.json();

      // Si ya es miembro → redirigir directamente sin mostrar error
      if (res.status === 409) {
        window.location.href = `/leagues/${league.id}`;
        return;
      }

      if (!res.ok) {
        setError(body.error ?? "Error al unirse a la liga.");
        return;
      }

      window.location.href = `/leagues/${league.id}`;
    });
  }

  function handleGoogle() {
    startTransition(async () => {
      await loginWithGoogle(`/join/${inviteCode}`);
    });
  }

  // ── No logueado ────────────────────────────────────────────────────────────
  if (!isLoggedIn) {
    return (
      <main
        className="min-h-screen flex flex-col items-center justify-center p-6 gap-5"
        style={{ background: "#02040a" }}
      >
        <div className="w-full max-w-sm space-y-5">
          <LeagueCard league={league} />

          <div className="space-y-3">
            <button
              onClick={handleGoogle}
              disabled={isPending}
              className="w-full h-13 flex items-center justify-center gap-3 rounded-xl font-bold text-sm text-white transition-all active:scale-[0.97] disabled:opacity-70"
              style={{
                height: "52px",
                background: "linear-gradient(135deg, #E4002B 0%, #B8001F 100%)",
                boxShadow: "0 4px 24px rgba(228,0,43,0.35)",
                letterSpacing: "1px",
              }}
            >
              {isPending ? (
                "REDIRIGIENDO..."
              ) : (
                <>
                  <GoogleIcon />
                  ENTRAR CON GOOGLE PARA UNIRME
                </>
              )}
            </button>

            <p className="text-center text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
              También podés{" "}
              <Link
                href={`/login?redirect=/join/${inviteCode}`}
                className="underline underline-offset-2"
                style={{ color: "rgba(255,255,255,0.55)" }}
              >
                iniciar sesión con email
              </Link>
            </p>

            <p className="text-center text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>
              ¿No tenés cuenta?{" "}
              <Link
                href={`/register?redirect=/join/${inviteCode}`}
                className="underline underline-offset-2"
                style={{ color: "rgba(255,255,255,0.5)" }}
              >
                Registrate
              </Link>
            </p>
          </div>
        </div>
      </main>
    );
  }

  // ── Logueado ───────────────────────────────────────────────────────────────
  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center p-6 gap-5"
      style={{ background: "#02040a" }}
    >
      <div className="w-full max-w-sm space-y-5">
        <LeagueCard league={league} />

        {error && (
          <p
            className="text-sm text-center rounded-xl px-4 py-3"
            style={{
              background: "rgba(228,0,43,0.08)",
              border: "1px solid rgba(228,0,43,0.2)",
              color: "rgba(228,0,43,0.9)",
            }}
          >
            {error}
          </p>
        )}

        <button
          onClick={handleJoin}
          disabled={isPending}
          className="w-full flex items-center justify-center gap-2 rounded-xl font-bold text-sm text-white transition-all active:scale-[0.97] disabled:opacity-70"
          style={{
            height: "52px",
            background: "linear-gradient(135deg, #E4002B 0%, #B8001F 100%)",
            boxShadow: "0 4px 24px rgba(228,0,43,0.35)",
            letterSpacing: "1px",
          }}
        >
          {isPending ? "UNIÉNDOME..." : `UNIRME A ${league.name.toUpperCase()}`}
        </button>
      </div>
    </main>
  );
}
