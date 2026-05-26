const outcomeConfig = {
  exact:     { label: "Exacto",     class: "text-green-600 font-semibold" },
  correct:   { label: "Correcto",   class: "text-amber-500 font-semibold" },
  incorrect: { label: "Incorrecto", class: "text-red-500 font-semibold"   },
};

type MatchTeam = { name: string; code: string };

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

export function PredictionHistory({ predictions }: Props) {
  if (predictions.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-6">
        Sin predicciones en partidos finalizados.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {predictions.map((p) => {
        const m = p.matches;
        if (!m) return null;
        const cfg = outcomeConfig[p.outcome];

        return (
          <div key={p.id} className="rounded-xl border bg-card px-4 py-3 space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold">
                {m.home_team.code} <span className="text-muted-foreground font-normal text-xs">vs</span> {m.away_team.code}
              </span>
              <span className={`text-xs ${cfg.class}`}>
                {cfg.label} · +{p.points_earned} pts
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span>
                Real: <span className="font-mono font-semibold text-foreground">{m.home_score}–{m.away_score}</span>
              </span>
              <span>
                Tu pred: <span className="font-mono font-semibold text-foreground">{p.home_score}–{p.away_score}</span>
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
