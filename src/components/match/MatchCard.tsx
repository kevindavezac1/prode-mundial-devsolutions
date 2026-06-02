"use client";

import { useState, useEffect } from "react";
import { FlagEmoji } from "@/components/match/FlagEmoji";
import { getMatchState } from "@/lib/match-helpers";
import type { MatchVisualState } from "@/lib/match-helpers";

// ─── Local types (sin cambios) ────────────────────────────────────────────────

type Team = {
  id?: number;
  name: string;
  code: string;
  flag_url?: string | null;
};

export type MatchCardMatch = {
  id: number;
  scheduled_at: string;
  status: "scheduled" | "live" | "finished" | "cancelled";
  home_team: Team;
  away_team: Team;
  home_score: number | null;
  away_score: number | null;
  group_name?: string | null;
};

export type MatchCardPrediction = {
  home_score: number;
  away_score: number;
  points_earned?: number | null;
} | null;

type Props = {
  match: MatchCardMatch;
  userPrediction: MatchCardPrediction;
  onPredictClick?: (matchId: number) => void;
};

// ─── Time helper (sin cambios) ────────────────────────────────────────────────

function formatMatchTime(scheduled_at: string): string {
  return new Date(scheduled_at).toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

// ─── State badge ──────────────────────────────────────────────────────────────

function formatDateLabel(scheduledAt: string): string {
  const scheduled = new Date(scheduledAt);
  const now = new Date();
  const fmt = (d: Date) => d.toLocaleDateString("es-AR");
  if (fmt(scheduled) === fmt(now)) return "HOY";
  return scheduled
    .toLocaleDateString("es-AR", {
      weekday: "short",
      day: "numeric",
      month: "short",
    })
    .toUpperCase();
}

function StateBadge({
  state,
  time,
  dateLabel,
}: {
  state: MatchVisualState;
  time: string;
  dateLabel: string;
}) {
  if (state === "live") {
    return (
      <div className="flex items-center gap-1.5">
        <span className="relative flex h-1.5 w-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-wc-red opacity-75" />
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-wc-red" />
        </span>
        <span
          style={{ letterSpacing: "3px" }}
          className="text-[10px] font-extrabold text-wc-red"
        >
          EN VIVO
        </span>
      </div>
    );
  }
  if (state === "locked-unpredicted") {
    return (
      <span
        style={{ letterSpacing: "1.5px" }}
        className="text-[10px] font-bold text-white/40"
      >
        🔒 CERRADO
      </span>
    );
  }
  if (state === "finished") {
    return (
      <span
        style={{ letterSpacing: "1.5px" }}
        className="text-[10px] font-bold text-white/40"
      >
        FINAL · {time}
      </span>
    );
  }
  return (
    <span
      style={{ letterSpacing: "1.5px" }}
      className="text-[10px] font-bold text-white/50"
    >
      {dateLabel} · {time}
    </span>
  );
}

// ─── Group badge ──────────────────────────────────────────────────────────────

function GroupBadge({ name }: { name: string }) {
  return (
    <div
      style={{ border: "1px solid rgba(255,255,255,0.08)" }}
      className="bg-white/5 px-2.5 py-0.5 rounded-full"
    >
      <span
        style={{ letterSpacing: "1.5px" }}
        className="text-[9px] font-bold text-white/35"
      >
        {name.toUpperCase()}
      </span>
    </div>
  );
}

// ─── Score display ────────────────────────────────────────────────────────────

function ScoreCenter({
  state,
  match,
  userPrediction,
}: {
  state: MatchVisualState;
  match: MatchCardMatch;
  userPrediction: MatchCardPrediction;
}) {
  const scoreClass =
    state === "live"
      ? "font-display text-[52px] text-white leading-none"
      : state === "finished"
      ? "font-display text-[44px] text-white/80 leading-none"
      : "font-display text-[28px] text-white/25 leading-none";

  if (state === "upcoming-unpredicted" || state === "locked-unpredicted") {
    return (
      <div className="flex items-center gap-2 px-2">
        <div
          style={{ border: "1.5px solid rgba(255,255,255,0.12)" }}
          className="w-10 h-12 rounded-lg bg-white/3 flex items-center justify-center font-display text-[26px] text-white/20 leading-none"
        >
          –
        </div>
        <span className="text-base text-white/15 font-light">:</span>
        <div
          style={{ border: "1.5px solid rgba(255,255,255,0.12)" }}
          className="w-10 h-12 rounded-lg bg-white/3 flex items-center justify-center font-display text-[26px] text-white/20 leading-none"
        >
          –
        </div>
      </div>
    );
  }

  if (state === "upcoming-predicted") {
    return (
      <div className="flex items-center gap-1 px-2">
        <span className="font-display text-[44px] text-white leading-none">
          {userPrediction!.home_score}
        </span>
        <span className="font-display text-[22px] text-white/20 leading-none mb-1">:</span>
        <span className="font-display text-[44px] text-white leading-none">
          {userPrediction!.away_score}
        </span>
      </div>
    );
  }

  // live or finished — show real score
  const home = state === "live" ? match.home_score : match.home_score;
  const away = state === "live" ? match.away_score : match.away_score;

  return (
    <div className="flex items-center gap-1 px-2">
      <span
        className={scoreClass}
        style={
          state === "live"
            ? { textShadow: "0 0 28px rgba(228,0,43,0.3)" }
            : undefined
        }
      >
        {home ?? "–"}
      </span>
      <span className="font-display text-[20px] text-white/15 leading-none mb-1">:</span>
      <span
        className={scoreClass}
        style={
          state === "live"
            ? { textShadow: "0 0 28px rgba(228,0,43,0.3)" }
            : undefined
        }
      >
        {away ?? "–"}
      </span>
    </div>
  );
}

// ─── Team column ──────────────────────────────────────────────────────────────

function TeamColumn({
  team,
  finished,
}: {
  team: Team;
  finished?: boolean;
}) {
  return (
    <div className="flex-1 flex flex-col items-center gap-2">
      <div
        style={{ border: "1px solid rgba(255,255,255,0.09)" }}
        className="w-14 h-14 rounded-full bg-gradient-to-br from-white/8 to-white/2 flex items-center justify-center overflow-hidden"
      >
        <FlagEmoji
          code={team.code}
          flagUrl={team.flag_url}
          className="w-full h-full rounded-full object-cover object-center"
          alt={team.name}
        />
      </div>
      <span
        style={{ letterSpacing: "1.5px" }}
        className={`text-[10px] font-extrabold text-center leading-tight ${
          finished ? "text-white/60" : "text-white/90"
        }`}
      >
        {team.name.toUpperCase()}
      </span>
    </div>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function CardFooter({
  state,
  userPrediction,
  onPredictClick,
  matchId,
}: {
  state: MatchVisualState;
  userPrediction: MatchCardPrediction;
  onPredictClick?: (matchId: number) => void;
  matchId: number;
}) {
  const dividerClass = "mt-3 pt-3 border-t border-white/6";

  if (state === "upcoming-unpredicted") {
    return (
      <div className="flex justify-center mt-3">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPredictClick?.(matchId);
          }}
          className="active:scale-95 transition-transform"
          style={{
            background: 'linear-gradient(135deg, #74ACDF, #4a8bc4)',
            color: 'white',
            padding: '8px 28px',
            borderRadius: '999px',
            fontSize: '11px',
            fontWeight: 800,
            letterSpacing: '2px',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          PREDECIR
        </button>
      </div>
    );
  }

  if (state === "upcoming-predicted") {
    return (
      <div className={dividerClass}>
        <p className="text-[10px] text-white/40 text-center" style={{ letterSpacing: "0.5px" }}>
          Tu predicción enviada · tappeá para editar
        </p>
      </div>
    );
  }

  if (state === "locked-unpredicted") {
    return (
      <p className="mt-3 text-[10px] text-white/30 italic text-center">
        Predicciones cerradas
      </p>
    );
  }

  if (state === "live") {
    return (
      <div
        className={`${dividerClass} flex justify-between items-center`}
        style={{ borderColor: "rgba(255,255,255,0.06)" }}
      >
        <span className="text-[10px] text-white/40" style={{ letterSpacing: "0.5px" }}>
          {userPrediction
            ? `TU PRED · ${userPrediction.home_score}–${userPrediction.away_score}`
            : "SIN PREDICCIÓN"}
        </span>
        <span
          className="text-[9px] text-wc-gold/60 font-bold"
          style={{ letterSpacing: "1.5px" }}
        >
          PUNTOS AL FINAL
        </span>
      </div>
    );
  }

  // finished
  if (!userPrediction) {
    return (
      <p className="mt-3 text-[10px] text-white/25 italic text-center">
        Sin predicción enviada
      </p>
    );
  }

  const { home_score, away_score, points_earned } = userPrediction;
  const predStr = `${home_score}–${away_score}`;

  const footerBase = (
    <div className={`${dividerClass} flex justify-between items-center`}
      style={{ borderColor: "rgba(255,255,255,0.06)" }}>
      <span className="text-[10px] text-white/40" style={{ letterSpacing: "0.5px" }}>
        TU PRED · <span className="text-white/70 font-bold">{predStr}</span>
      </span>
      {points_earned === 300 && (
        <div
          className="flex items-center gap-1 px-2.5 py-1 rounded"
          style={{
            background: "rgba(212,175,55,0.1)",
            border: "1px solid rgba(212,175,55,0.25)",
          }}
        >
          <span className="font-display text-[15px] text-wc-gold leading-none">+300</span>
          <span className="text-[9px] text-wc-gold/60 font-bold" style={{ letterSpacing: "1px" }}>PTS 🎯</span>
        </div>
      )}
      {points_earned === 100 && (
        <div
          className="flex items-center gap-1 px-2.5 py-1 rounded"
          style={{
            background: "rgba(212,175,55,0.08)",
            border: "1px solid rgba(212,175,55,0.2)",
          }}
        >
          <span className="font-display text-[15px] text-wc-gold leading-none">+100</span>
          <span className="text-[9px] text-wc-gold/60 font-bold" style={{ letterSpacing: "1px" }}>PTS ✓</span>
        </div>
      )}
      {points_earned === 0 && (
        <span className="text-[10px] text-white/25 font-bold" style={{ letterSpacing: "1px" }}>0 PTS</span>
      )}
      {(points_earned === null || points_earned === undefined) && (
        <span className="text-[10px] text-white/25 italic">Calculando...</span>
      )}
    </div>
  );

  return footerBase;
}

// ─── Main component ────────────────────────────────────────────────────────────

export function MatchCard({ match, userPrediction, onPredictClick }: Props) {
  const state = getMatchState(match, userPrediction);
  const isClickable =
    state === "upcoming-unpredicted" || state === "upcoming-predicted";
  const [time, setTime] = useState<string>("–");
  const [dateLabel, setDateLabel] = useState<string>("");

  useEffect(() => {
    setTime(formatMatchTime(match.scheduled_at));
    setDateLabel(formatDateLabel(match.scheduled_at));
  }, [match.scheduled_at]);

  const isFinishedState = state === "finished";
  const isLiveState = state === "live";

  // Card border accent per state
  const borderStyle = isLiveState
    ? {
        border: "1px solid rgba(228,0,43,0.35)",
        boxShadow:
          "0 0 0 1px rgba(228,0,43,0.08), 0 4px 24px rgba(228,0,43,0.12)",
      }
    : isFinishedState && userPrediction
    ? {
        border: "1px solid rgba(212,175,55,0.15)",
        boxShadow: "none",
      }
    : {
        border: "1px solid rgba(255,255,255,0.06)",
        boxShadow: "none",
      };

  // Top accent line per state
  const topAccent = isLiveState ? (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: "2px",
        background:
          "linear-gradient(90deg, transparent 0%, #E4002B 50%, transparent 100%)",
      }}
    />
  ) : isFinishedState && userPrediction ? (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: "1px",
        background:
          "linear-gradient(90deg, transparent, rgba(212,175,55,0.35), transparent)",
      }}
    />
  ) : null;

  // Background tint per state
  const bgGradient = isLiveState
    ? "linear-gradient(160deg, #1a0a0e 0%, #0d0d1a 40%, #07090f 100%)"
    : isFinishedState
    ? "linear-gradient(160deg, #0f0e0a 0%, #07090f 100%)"
    : "linear-gradient(160deg, #0d1120 0%, #07090f 100%)";

  return (
    <div
      onClick={isClickable ? () => onPredictClick?.(match.id) : undefined}
      className={`relative mb-3 rounded-2xl overflow-hidden transition-transform ${
        isClickable ? "cursor-pointer active:scale-[0.98]" : ""
      } ${state === "locked-unpredicted" ? "opacity-60" : ""}`}
      style={{ background: bgGradient, ...borderStyle }}
    >
      {topAccent}

      {/* Header */}
      <div className="flex justify-between items-center px-4 pt-4 pb-0">
        <StateBadge state={state} time={time} dateLabel={dateLabel} />
        {match.group_name && <GroupBadge name={match.group_name} />}
      </div>

      {/* Match body — symmetric layout */}
      <div className="flex items-center justify-between px-4 py-5">
        <TeamColumn team={match.home_team} finished={isFinishedState} />
        <ScoreCenter state={state} match={match} userPrediction={userPrediction} />
        <TeamColumn team={match.away_team} finished={isFinishedState} />
      </div>

      {/* Footer */}
      <div className="px-4 pb-4">
        <CardFooter
          state={state}
          userPrediction={userPrediction}
          onPredictClick={onPredictClick}
          matchId={match.id}
        />
      </div>
    </div>
  );
}