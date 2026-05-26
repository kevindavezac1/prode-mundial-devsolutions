"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
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
  exact:     { label: "Exacto",    class: "text-green-600 font-semibold" },
  correct:   { label: "Correcto",  class: "text-amber-500 font-semibold" },
  incorrect: { label: "Incorrecto",class: "text-red-500 font-semibold"   },
  pending:   { label: "Pendiente", class: "text-muted-foreground"        },
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
    <div className="rounded-xl border bg-card px-4 py-3 space-y-3">
      {/* Teams + scores row */}
      <div className="flex items-center gap-2">
        {/* Home team */}
        <div className="flex-1 min-w-0 text-right">
          <p className="font-bold text-sm leading-tight">{match.home_team.code}</p>
          <p className="text-xs text-muted-foreground truncate">{match.home_team.name}</p>
        </div>

        {/* Score area */}
        <div className="flex items-center gap-1.5 shrink-0">
          {finished || live ? (
            /* Real result */
            <div className="flex items-center gap-2 text-2xl font-bold tabular-nums">
              <span>{match.home_score ?? "–"}</span>
              <span className="text-muted-foreground text-lg">-</span>
              <span>{match.away_score ?? "–"}</span>
            </div>
          ) : locked ? (
            /* Locked — prediction read-only */
            <div className="flex items-center gap-2 text-xl font-semibold text-muted-foreground tabular-nums">
              <span>{prediction?.home_score ?? "–"}</span>
              <span className="text-base">-</span>
              <span>{prediction?.away_score ?? "–"}</span>
            </div>
          ) : (
            /* Editable inputs */
            <form onSubmit={handleSubmit} className="flex items-center gap-1.5">
              <ScoreInput value={homeVal} onChange={setHomeVal} disabled={saving} />
              <span className="text-muted-foreground font-medium">-</span>
              <ScoreInput value={awayVal} onChange={setAwayVal} disabled={saving} />
              <Button
                type="submit"
                size="sm"
                disabled={!valid || !!unchanged || saving}
                className="h-9 px-3 text-xs"
              >
                {saving ? "…" : "Guardar"}
              </Button>
            </form>
          )}
        </div>

        {/* Away team */}
        <div className="flex-1 min-w-0 text-left">
          <p className="font-bold text-sm leading-tight">{match.away_team.code}</p>
          <p className="text-xs text-muted-foreground truncate">{match.away_team.name}</p>
        </div>
      </div>

      {/* Prediction result row (finished matches) */}
      {finished && prediction && outcome && outcome !== "pending" && (
        <div className="flex items-center justify-center gap-2 text-xs">
          <span className="text-muted-foreground">
            Tu pred: {prediction.home_score}–{prediction.away_score}
          </span>
          <span className={outcomeConfig[outcome].class}>
            {outcomeConfig[outcome].label}
          </span>
          <span className="text-muted-foreground">
            +{prediction.points_earned} pts
          </span>
        </div>
      )}

      {/* Locked without prediction */}
      {locked && !finished && !prediction && (
        <p className="text-xs text-muted-foreground text-center">Sin predicción</p>
      )}

      {/* Venue + time */}
      <div className="text-[11px] text-muted-foreground text-center leading-tight">
        {match.venue && <span>{match.venue} · </span>}
        {timeStr ?? "–"}
        {live && <span className="ml-1 text-red-500 font-semibold">EN VIVO</span>}
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
      className="w-10 h-9 rounded-md border border-input bg-background text-center text-base font-bold focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50"
    />
  );
}
