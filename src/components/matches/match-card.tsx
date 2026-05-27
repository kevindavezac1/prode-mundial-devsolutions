"use client";

import { useEffect, useRef, useState } from "react";
import type { MatchWithTeams, Prediction } from "@/types/matches";

type Props = {
  match: MatchWithTeams;
  prediction: Prediction | undefined;
  onSave: (matchId: number, home: number, away: number) => Promise<void>;
};

function isLocked(scheduledAt: string) {
  return Date.now() >= new Date(scheduledAt).getTime() - 5 * 60 * 1000;
}

function formatTime(scheduledAt: string) {
  return new Date(scheduledAt).toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

const outcomeConfig = {
  exact:     { label: "Exacto",    class: "text-green-400 font-semibold" },
  correct:   { label: "Correcto",  class: "text-amber-400 font-semibold" },
  incorrect: { label: "Incorrecto",class: "text-red-400 font-semibold"   },
  pending:   { label: "Pendiente", class: "" },
};

export function MatchCard({ match, prediction, onSave }: Props) {
  const locked = isLocked(match.scheduled_at);
  const finished = match.status === "finished";
  const live = match.status === "live";

  const [homeVal, setHomeVal] = useState("");
  const [awayVal, setAwayVal] = useState("");
  const [saving, setSaving] = useState(false);
  const [timeStr, setTimeStr] = useState<string | null>(null);
  const hydrated = useRef(false);

  useEffect(() => {
    if (!hydrated.current && prediction !== undefined) {
      hydrated.current = true;
      setHomeVal(String(prediction.home_score));
      setAwayVal(String(prediction.away_score));
    }
  }, [prediction]);

  useEffect(() => {
    setTimeStr(formatTime(match.scheduled_at));
  }, [match.scheduled_at]);

  const homeNum = parseInt(homeVal, 10);
  const awayNum = parseInt(awayVal, 10);
  const valid = !isNaN(homeNum) && !isNaN(awayNum) && homeNum >= 0 && awayNum >= 0;
  const unchanged =
    valid &&
    prediction &&
    prediction.home_score === homeNum &&
    prediction.away_score === awayNum;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid || unchanged || saving) return;
    setSaving(true);
    await onSave(match.id, homeNum, awayNum);
    setSaving(false);
  }

  const outcome = prediction?.outcome;

  return (
    <div
      className="rounded-2xl px-4 py-3 space-y-3"
      style={{
        background: "linear-gradient(160deg, #0d1120 0%, #07090f 100%)",
        border: live
          ? "1px solid rgba(228,0,43,0.3)"
          : "1px solid rgba(255,255,255,0.07)",
      }}
    >
      {/* Teams + scores row */}
      <div className="flex items-center gap-2">
        {/* Home team */}
        <div className="flex-1 min-w-0 text-right">
          <p className="font-bold text-sm leading-tight text-white">{match.home_team.code}</p>
          <p className="text-xs truncate" style={{ color: "rgba(255,255,255,0.4)" }}>{match.home_team.name}</p>
        </div>

        {/* Score area */}
        <div className="flex items-center gap-1.5 shrink-0">
          {finished || live ? (
            /* Real result */
            <div className="flex items-center gap-2 text-2xl font-bold tabular-nums text-white font-display">
              <span>{match.home_score ?? "–"}</span>
              <span className="text-lg" style={{ color: "rgba(255,255,255,0.3)" }}>-</span>
              <span>{match.away_score ?? "–"}</span>
            </div>
          ) : locked ? (
            /* Locked — prediction read-only */
            <div className="flex items-center gap-2 text-xl font-semibold tabular-nums font-display" style={{ color: "rgba(255,255,255,0.5)" }}>
              <span>{prediction?.home_score ?? "–"}</span>
              <span className="text-base">-</span>
              <span>{prediction?.away_score ?? "–"}</span>
            </div>
          ) : (
            /* Editable inputs */
            <form onSubmit={handleSubmit} className="flex items-center gap-1.5">
              <ScoreInput value={homeVal} onChange={setHomeVal} disabled={saving} />
              <span className="font-medium" style={{ color: "rgba(255,255,255,0.4)" }}>-</span>
              <ScoreInput value={awayVal} onChange={setAwayVal} disabled={saving} />
              <button
                type="submit"
                disabled={!valid || !!unchanged || saving}
                className="h-9 px-3 text-xs font-semibold rounded-xl text-white transition-all active:scale-95 disabled:opacity-40"
                style={{
                  background: "linear-gradient(135deg, #E4002B 0%, #B8001F 100%)",
                  boxShadow: "0 2px 10px rgba(228,0,43,0.2)",
                }}
              >
                {saving ? "…" : "Guardar"}
              </button>
            </form>
          )}
        </div>

        {/* Away team */}
        <div className="flex-1 min-w-0 text-left">
          <p className="font-bold text-sm leading-tight text-white">{match.away_team.code}</p>
          <p className="text-xs truncate" style={{ color: "rgba(255,255,255,0.4)" }}>{match.away_team.name}</p>
        </div>
      </div>

      {/* Prediction result row (finished matches) */}
      {finished && prediction && outcome && outcome !== "pending" && (
        <div className="flex items-center justify-center gap-2 text-xs">
          <span style={{ color: "rgba(255,255,255,0.4)" }}>
            Tu pred: {prediction.home_score}–{prediction.away_score}
          </span>
          <span className={outcomeConfig[outcome].class}>
            {outcomeConfig[outcome].label}
          </span>
          <span style={{ color: "rgba(255,255,255,0.4)" }}>
            +{prediction.points_earned} pts
          </span>
        </div>
      )}

      {/* Locked without prediction */}
      {locked && !finished && !prediction && (
        <p className="text-xs text-center" style={{ color: "rgba(255,255,255,0.3)" }}>Sin predicción</p>
      )}

      {/* Venue + time */}
      <div className="text-[11px] text-center leading-tight" style={{ color: "rgba(255,255,255,0.3)" }}>
        {match.venue && <span>{match.venue} · </span>}
        {timeStr ?? "–"}
        {live && <span className="ml-1 text-red-400 font-semibold">EN VIVO</span>}
      </div>
    </div>
  );
}

function ScoreInput({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  disabled: boolean;
}) {
  return (
    <input
      type="number"
      inputMode="numeric"
      pattern="[0-9]*"
      min={0}
      max={20}
      value={value}
      onChange={(e) => {
        const v = e.target.value;
        if (v === "" || (Number(v) >= 0 && Number(v) <= 20)) onChange(v);
      }}
      disabled={disabled}
      className="w-10 h-9 rounded-xl text-center text-base font-bold text-white focus:outline-none disabled:opacity-50"
      style={{
        background: "rgba(255,255,255,0.07)",
        border: "1px solid rgba(255,255,255,0.12)",
      }}
    />
  );
}
