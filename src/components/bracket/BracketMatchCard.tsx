"use client";

import { useEffect, useState } from "react";
import { FlagEmoji } from "@/components/match/FlagEmoji";
import type { MatchWithTeams } from "@/types/matches";

function toUTCDate(s: string): Date {
  const normalized = s.replace(" ", "T").replace("+00:00", "Z");
  return new Date(normalized.endsWith("Z") ? normalized : normalized + "Z");
}

function formatMatchDateTime(scheduled_at: string): string {
  const d = toUTCDate(scheduled_at);
  const date = d.toLocaleDateString("es-AR", {
    timeZone: "America/Argentina/Buenos_Aires",
    day: "numeric",
    month: "short",
  });
  const time = d.toLocaleTimeString("es-AR", {
    timeZone: "America/Argentina/Buenos_Aires",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return `${date} · ${time}`;
}

// ─── Team slot ────────────────────────────────────────────────────────────────

function TeamSlot({
  team,
  slot,
  align,
  dimmed,
}: {
  team: MatchWithTeams["home_team"];
  slot?: string | null;
  align: "left" | "right";
  dimmed: boolean;
}) {
  const isRight = align === "right";
  return (
    <div
      className={`flex-1 flex items-center gap-2.5 ${isRight ? "flex-row-reverse" : ""}`}
    >
      <div
        style={{ border: "1px solid rgba(255,255,255,0.09)" }}
        className="w-10 h-10 rounded-full bg-gradient-to-br from-white/8 to-white/2 flex items-center justify-center overflow-hidden shrink-0"
      >
        {team ? (
          <FlagEmoji
            code={team.code}
            flagUrl={team.flag_url}
            className="w-full h-full rounded-full object-cover object-center"
            alt={team.name}
          />
        ) : (
          <span className="text-white/20 text-base font-bold">?</span>
        )}
      </div>
      <span
        style={{ letterSpacing: "0.8px" }}
        className={`text-[11px] font-extrabold leading-tight ${isRight ? "text-right" : "text-left"} ${
          dimmed ? "text-white/30" : team ? "text-white/90" : "text-white/25"
        }`}
      >
        {team ? team.name.toUpperCase() : (slot?.toUpperCase() ?? "POR DEFINIR")}
      </span>
    </div>
  );
}

// ─── Score block ─────────────────────────────────────────────────────────────

function ScoreBlock({ match }: { match: MatchWithTeams }) {
  const { status, home_score, away_score, penalty_winner } = match;

  if (status === "finished" && home_score !== null && away_score !== null) {
    const penWinnerName =
      penalty_winner === "home"
        ? match.home_team?.name ?? "Local"
        : penalty_winner === "away"
        ? match.away_team?.name ?? "Visitante"
        : null;

    return (
      <div className="flex flex-col items-center shrink-0 px-1">
        <div className="flex items-center gap-1">
          <span className="font-display text-[36px] text-white/90 leading-none tabular-nums">
            {home_score}
          </span>
          <span className="font-display text-[18px] text-white/20 leading-none">–</span>
          <span className="font-display text-[36px] text-white/90 leading-none tabular-nums">
            {away_score}
          </span>
        </div>
        {penWinnerName && (
          <span
            className="text-[9px] font-bold text-white/40 mt-0.5"
            style={{ letterSpacing: "1px" }}
          >
            {penWinnerName.toUpperCase()} PEN
          </span>
        )}
      </div>
    );
  }

  if (status === "live") {
    return (
      <div className="flex flex-col items-center shrink-0 px-1">
        <div className="flex items-center gap-1">
          <span className="font-display text-[36px] text-white leading-none tabular-nums"
            style={{ textShadow: "0 0 20px rgba(228,0,43,0.4)" }}>
            {home_score ?? "–"}
          </span>
          <span className="font-display text-[18px] text-white/20 leading-none">–</span>
          <span className="font-display text-[36px] text-white leading-none tabular-nums"
            style={{ textShadow: "0 0 20px rgba(228,0,43,0.4)" }}>
            {away_score ?? "–"}
          </span>
        </div>
        <div className="flex items-center gap-1 mt-0.5">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-wc-red opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-wc-red" />
          </span>
          <span className="text-[9px] font-extrabold text-wc-red" style={{ letterSpacing: "2px" }}>
            EN VIVO
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 shrink-0 px-2">
      <div
        style={{ border: "1.5px solid rgba(255,255,255,0.10)" }}
        className="w-8 h-10 rounded-lg bg-white/3 flex items-center justify-center font-display text-[22px] text-white/15 leading-none"
      >
        –
      </div>
      <span className="text-white/10 font-light">:</span>
      <div
        style={{ border: "1.5px solid rgba(255,255,255,0.10)" }}
        className="w-8 h-10 rounded-lg bg-white/3 flex items-center justify-center font-display text-[22px] text-white/15 leading-none"
      >
        –
      </div>
    </div>
  );
}

// ─── Main card ────────────────────────────────────────────────────────────────

export function BracketMatchCard({ match }: { match: MatchWithTeams }) {
  const [dateTime, setDateTime] = useState<string>("");

  useEffect(() => {
    setDateTime(formatMatchDateTime(match.scheduled_at));
  }, [match.scheduled_at]);

  const isLive = match.status === "live";
  const isFinished = match.status === "finished";
  const isScheduled = match.status === "scheduled";
  const teamsKnown = match.home_team !== null && match.away_team !== null;

  const borderStyle = isLive
    ? {
        border: "1px solid rgba(228,0,43,0.35)",
        boxShadow: "0 0 0 1px rgba(228,0,43,0.08), 0 4px 24px rgba(228,0,43,0.12)",
      }
    : isFinished
    ? { border: "1px solid rgba(255,255,255,0.08)" }
    : { border: "1px solid rgba(255,255,255,0.06)" };

  const bgGradient = isLive
    ? "linear-gradient(160deg, #1a0a0e 0%, #0d0d1a 40%, #07090f 100%)"
    : isFinished
    ? "linear-gradient(160deg, #0f0e0a 0%, #07090f 100%)"
    : "linear-gradient(160deg, #0d1120 0%, #07090f 100%)";

  return (
    <div
      className="rounded-2xl overflow-hidden mb-3"
      style={{ background: bgGradient, ...borderStyle }}
    >
      {isLive && (
        <div
          style={{
            position: "absolute",
            top: 0, left: 0, right: 0,
            height: "2px",
            background: "linear-gradient(90deg, transparent 0%, #E4002B 50%, transparent 100%)",
          }}
        />
      )}

      {/* Header */}
      <div
        className="flex justify-between items-center px-4 pt-3 pb-0"
        style={{ position: "relative" }}
      >
        <span
          className="text-[10px] font-bold text-white/30"
          style={{ letterSpacing: "1.5px" }}
        >
          {isFinished ? "FINALIZADO" : isLive ? "" : isScheduled && dateTime ? dateTime.toUpperCase() : ""}
        </span>
        {match.venue && (
          <span
            className="text-[9px] text-white/20 truncate max-w-[140px]"
            style={{ letterSpacing: "0.5px" }}
          >
            {match.venue.split(",")[0]}
          </span>
        )}
      </div>

      {/* Teams + score */}
      <div className="flex items-center px-4 py-4 gap-2">
        <TeamSlot
          team={match.home_team}
          slot={match.home_slot}
          align="left"
          dimmed={isFinished && !teamsKnown}
        />
        <ScoreBlock match={match} />
        <TeamSlot
          team={match.away_team}
          slot={match.away_slot}
          align="right"
          dimmed={isFinished && !teamsKnown}
        />
      </div>
    </div>
  );
}
