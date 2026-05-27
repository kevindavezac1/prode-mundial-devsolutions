"use client";

import { useState } from "react";
import { toast } from "sonner";
import type { LeagueDetail, LeagueMember } from "@/types/leagues";

type Props = { league: LeagueDetail; userId: string };

export function LeagueDetailView({ league, userId }: Props) {
  const [copied, setCopied] = useState(false);

  function getInviteLink() {
    return `${window.location.origin}/join/${league.invite_code}`;
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(getInviteLink());
      setCopied(true);
      toast.success("Link copiado");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("No se pudo copiar");
    }
  }

  return (
    <div className="space-y-5">

      {/* Invite section */}
      <div
        className="rounded-2xl px-4 py-4 space-y-3"
        style={{
          background: "linear-gradient(160deg, #0d1120 0%, #07090f 100%)",
          border: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        <p
          className="text-[10px] font-bold"
          style={{ color: "rgba(255,255,255,0.35)", letterSpacing: "2px" }}
        >
          INVITAR AMIGOS
        </p>

        <div className="flex items-center gap-2">
          <div
            className="flex-1 px-3 py-2 rounded-xl font-display text-lg text-white tracking-widest truncate"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            {league.invite_code}
          </div>
          <button
            onClick={copyLink}
            className="px-4 py-2 rounded-xl text-[11px] font-bold transition-all active:scale-95"
            style={
              copied
                ? {
                    background: "rgba(10,110,62,0.2)",
                    border: "1px solid rgba(10,110,62,0.4)",
                    color: "#4ade80",
                    letterSpacing: "1px",
                  }
                : {
                    background: "rgba(255,255,255,0.07)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    color: "rgba(255,255,255,0.7)",
                    letterSpacing: "1px",
                  }
            }
          >
            {copied ? "✓ COPIADO" : "COPIAR"}
          </button>
        </div>

        <p
          className="text-[10px] break-all"
          style={{ color: "rgba(255,255,255,0.2)" }}
        >
          {typeof window !== "undefined"
            ? `${window.location.origin}/join/${league.invite_code}`
            : `…/join/${league.invite_code}`}
        </p>
      </div>

      {/* Leaderboard */}
      <div className="space-y-2">
        <p
          className="text-[10px] font-bold px-1"
          style={{ color: "rgba(255,255,255,0.35)", letterSpacing: "2px" }}
        >
          TABLA DE POSICIONES
        </p>

        <div
          className="rounded-2xl overflow-hidden"
          style={{ border: "1px solid rgba(255,255,255,0.07)" }}
        >
          {/* Header row */}
          <div
            className="grid grid-cols-[2rem_1fr_4rem] gap-2 px-4 py-2"
            style={{
              background: "rgba(255,255,255,0.03)",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <span className="text-[10px] font-bold text-center" style={{ color: "rgba(255,255,255,0.25)", letterSpacing: "1px" }}>#</span>
            <span className="text-[10px] font-bold" style={{ color: "rgba(255,255,255,0.25)", letterSpacing: "1px" }}>JUGADOR</span>
            <span className="text-[10px] font-bold text-right" style={{ color: "rgba(255,255,255,0.25)", letterSpacing: "1px" }}>PTS</span>
          </div>

          {league.members.length === 0 ? (
            <p className="text-sm text-center py-8" style={{ color: "rgba(255,255,255,0.3)" }}>
              Sin miembros.
            </p>
          ) : (
            league.members.map((member, idx) => (
              <MemberRow
                key={member.user_id}
                member={member}
                position={idx + 1}
                isMe={member.user_id === userId}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function MemberRow({
  member,
  position,
  isMe,
}: {
  member: LeagueMember;
  position: number;
  isMe: boolean;
}) {
  const medal =
    position === 1 ? "🥇" : position === 2 ? "🥈" : position === 3 ? "🥉" : null;

  return (
    <div
      className="grid grid-cols-[2rem_1fr_4rem] gap-2 px-4 py-3 items-center"
      style={{
        borderBottom: "1px solid rgba(255,255,255,0.04)",
        background: isMe ? "rgba(228,0,43,0.06)" : "transparent",
      }}
    >
      <span className="text-sm text-center font-bold" style={{ color: "rgba(255,255,255,0.4)" }}>
        {medal ?? position}
      </span>

      <div className="flex items-center gap-2.5 min-w-0">
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
          style={{ background: isMe ? "rgba(228,0,43,0.3)" : "rgba(255,255,255,0.08)" }}
        >
          {member.display_name[0]?.toUpperCase() ?? "?"}
        </div>
        <span className="text-sm text-white truncate font-medium">
          {member.display_name}
          {isMe && (
            <span className="ml-1 text-[10px] text-wc-red font-bold"> (vos)</span>
          )}
        </span>
      </div>

      <div className="text-right">
        <span
          className="font-display text-base text-white tabular-nums"
          style={position <= 3 ? { color: "#D4AF37" } : {}}
        >
          {member.total_points}
        </span>
        <span className="text-[10px] ml-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>pts</span>
      </div>
    </div>
  );
}