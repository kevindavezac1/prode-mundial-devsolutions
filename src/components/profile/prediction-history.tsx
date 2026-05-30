"use client";

import { FlagEmoji } from "@/components/match/FlagEmoji";

type MatchTeam = { name: string; code: string; flag_url?: string | null };

type PredictionRow = {
  id: number;
  home_score: number;
  away_score: number;
  outcome: "exact" | "correct" | "incorrect";
  points_earned: number;
  matches: {
    id: number;
    scheduled_at: string;
    home_score: number;
    away_score: number;
    home_team: MatchTeam;
    away_team: MatchTeam;
  } | null;
};

type Props = { predictions: PredictionRow[] };

const OUTCOME = {
  exact:     { label: "Exacto",     pts: "+300 pts", bg: "rgba(34,197,94,0.12)",  border: "rgba(34,197,94,0.3)",  color: "#4ade80" },
  correct:   { label: "Correcto",   pts: "+100 pts", bg: "rgba(234,179,8,0.12)", border: "rgba(234,179,8,0.3)",  color: "#facc15" },
  incorrect: { label: "Incorrecto", pts: "+0 pts",   bg: "rgba(239,68,68,0.10)", border: "rgba(239,68,68,0.25)", color: "#f87171" },
};

export function PredictionHistory({ predictions }: Props) {
  if (predictions.length === 0) {
    return (
      <p className="text-sm text-center py-6" style={{ color: "rgba(255,255,255,0.4)" }}>
        Sin predicciones en partidos finalizados.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {predictions.map((p) => {
        const m = p.matches;
        if (!m) return null;
        const cfg = OUTCOME[p.outcome];

        return (
          <div
            key={p.id}
            className="rounded-2xl overflow-hidden"
            style={{
              background: "linear-gradient(160deg, #0d1120 0%, #07090f 100%)",
              border: "1px solid rgba(255,255,255,0.07)",
            }}
          >
            {/* Teams row */}
            <div className="flex items-center gap-2 px-4 pt-3 pb-2">
              {/* Home team */}
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className="w-7 h-7 rounded-full overflow-hidden shrink-0" style={{ border: "1px solid rgba(255,255,255,0.1)" }}>
                  <FlagEmoji
                    code={m.home_team.code}
                    flagUrl={(m.home_team as MatchTeam).flag_url}
                    className="w-full h-full object-cover"
                    alt={m.home_team.name}
                  />
                </div>
                <span className="text-sm font-semibold text-white truncate">{m.home_team.name}</span>
              </div>

              {/* Real score */}
              <div className="shrink-0 text-center px-2">
                <span
                  className="font-display text-lg font-bold text-white tabular-nums"
                  style={{ letterSpacing: "2px" }}
                >
                  {m.home_score}–{m.away_score}
                </span>
              </div>

              {/* Away team */}
              <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                <span className="text-sm font-semibold text-white truncate text-right">{m.away_team.name}</span>
                <div className="w-7 h-7 rounded-full overflow-hidden shrink-0" style={{ border: "1px solid rgba(255,255,255,0.1)" }}>
                  <FlagEmoji
                    code={m.away_team.code}
                    flagUrl={(m.away_team as MatchTeam).flag_url}
                    className="w-full h-full object-cover"
                    alt={m.away_team.name}
                  />
                </div>
              </div>
            </div>

            {/* Footer row */}
            <div
              className="flex items-center justify-between px-4 py-2"
              style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
            >
              <span className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
                Tu pred:{" "}
                <span className="font-mono font-semibold text-white">
                  {p.home_score}–{p.away_score}
                </span>
              </span>

              <span
                className="text-[11px] font-bold px-2.5 py-1 rounded-full"
                style={{
                  background: cfg.bg,
                  border: `1px solid ${cfg.border}`,
                  color: cfg.color,
                  letterSpacing: "0.3px",
                }}
              >
                {cfg.label} {cfg.pts}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
