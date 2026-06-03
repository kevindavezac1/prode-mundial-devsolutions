"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import type { League } from "@/types/leagues";
import { LeagueAvatar } from "@/components/leagues/league-avatar";

type Props = { leagues: League[]; userId: string };

export function MyLeagues({ leagues, userId }: Props) {
  const router = useRouter();
  const [panel, setPanel] = useState<"none" | "create" | "join">("none");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [isPending, startTransition] = useTransition();

  function togglePanel(next: "create" | "join") {
    setPanel((p) => (p === next ? "none" : next));
    setName("");
    setCode("");
  }

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await fetch("/api/leagues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const body = await res.json();
      if (!res.ok) { toast.error(body.error ?? "Error al crear liga"); return; }
      toast.success("Liga creada");
      router.push(`/leagues/${body.data.id}`);
    });
  }

  function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await fetch("/api/leagues/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invite_code: code }),
      });
      const body = await res.json();
      if (!res.ok) { toast.error(body.error ?? "Error al unirse"); return; }
      toast.success("Te uniste a la liga");
      router.push(`/leagues/${body.data.league_id}`);
    });
  }

  const inputClass = `
    w-full px-3 py-2.5 rounded-xl text-sm text-white font-medium
    placeholder:text-white/25 outline-none transition-all
    focus:ring-1 focus:ring-wc-red/50
  `;
  const inputStyle = {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
  };

  return (
    <div className="space-y-4">

      {/* Action buttons */}
      <div className="flex gap-2">
        {(["create", "join"] as const).map((action) => (
          <button
            key={action}
            onClick={() => togglePanel(action)}
            disabled={isPending}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold tracking-wider transition-all active:scale-[0.97] disabled:opacity-40"
            style={
              panel === action
                ? {
                    background: "linear-gradient(135deg, #E4002B 0%, #B8001F 100%)",
                    color: "white",
                    boxShadow: "0 4px 16px rgba(228,0,43,0.25)",
                    letterSpacing: "1.5px",
                  }
                : {
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: "rgba(255,255,255,0.7)",
                    letterSpacing: "1.5px",
                  }
            }
          >
            {action === "create" ? "+ CREAR LIGA" : "UNIRME"}
          </button>
        ))}
      </div>

      {/* Create panel */}
      {panel === "create" && (
        <form
          onSubmit={handleCreate}
          className="rounded-2xl p-4 space-y-3"
          style={{
            background: "linear-gradient(160deg, #0d1120 0%, #07090f 100%)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <p
            className="text-[10px] font-bold text-white/40"
            style={{ letterSpacing: "2px" }}
          >
            NUEVA LIGA
          </p>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej: Los de la oficina"
            maxLength={50}
            disabled={isPending}
            className={inputClass}
            style={inputStyle}
          />
          <button
            type="submit"
            disabled={isPending || name.trim().length < 2}
            className="w-full py-3 rounded-xl font-bold text-[11px] text-white transition-all active:scale-[0.97] disabled:opacity-30"
            style={{
              background: "linear-gradient(135deg, #E4002B 0%, #B8001F 100%)",
              letterSpacing: "2px",
              boxShadow: "0 4px 16px rgba(228,0,43,0.2)",
            }}
          >
            {isPending ? "CREANDO..." : "CREAR"}
          </button>
        </form>
      )}

      {/* Join panel */}
      {panel === "join" && (
        <form
          onSubmit={handleJoin}
          className="rounded-2xl p-4 space-y-3"
          style={{
            background: "linear-gradient(160deg, #0d1120 0%, #07090f 100%)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <p
            className="text-[10px] font-bold text-white/40"
            style={{ letterSpacing: "2px" }}
          >
            CÓDIGO DE INVITACIÓN
          </p>
          <input
            value={code}
            onChange={(e) => {
              const val = e.target.value;
              const extracted = val.includes("/")
                ? val.split("/").filter(Boolean).pop() ?? val
                : val;
              setCode(extracted.toUpperCase());
            }}
            placeholder="Ej: ABC12345 o pegá el link completo"
            disabled={isPending}
            className={`${inputClass} font-display text-xl tracking-widest`}
            style={inputStyle}
          />
          <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.3)" }}>
            Pegá el link de invitación o el código de 8 caracteres
          </p>
          <button
            type="submit"
            disabled={isPending || code.trim().length < 4}
            className="w-full py-3 rounded-xl font-bold text-[11px] text-white transition-all active:scale-[0.97] disabled:opacity-30"
            style={{
              background: "linear-gradient(135deg, #E4002B 0%, #B8001F 100%)",
              letterSpacing: "2px",
              boxShadow: "0 4px 16px rgba(228,0,43,0.2)",
            }}
          >
            {isPending ? "UNIÉNDOME..." : "UNIRME"}
          </button>
        </form>
      )}

      {/* Liga list */}
      {leagues.length === 0 ? (
        <p
          className="text-sm text-center py-10"
          style={{ color: "rgba(255,255,255,0.3)" }}
        >
          No estás en ninguna liga todavía.
        </p>
      ) : (
        <div className="space-y-2">
          {leagues.map((league) => (
            <Link
              key={league.id}
              href={`/leagues/${league.id}`}
              className="flex items-center gap-3 rounded-2xl px-4 py-3.5 transition-all active:scale-[0.98]"
              style={{
                background: "linear-gradient(160deg, #0d1120 0%, #07090f 100%)",
                border: "1px solid rgba(255,255,255,0.07)",
              }}
            >
              <LeagueAvatar imageUrl={league.image_url ?? null} name={league.name} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="font-bold text-sm text-white truncate">{league.name}</p>
                <p
                  className="text-xs mt-0.5"
                  style={{ color: "rgba(255,255,255,0.35)" }}
                >
                  {league.member_count ?? 0} / {league.max_members} miembros
                  {league.owner_id === userId && (
                    <span className="ml-2 text-wc-red font-semibold">· Admin</span>
                  )}
                </p>
              </div>
              <span style={{ color: "rgba(255,255,255,0.2)" }} className="ml-3 text-lg">›</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}