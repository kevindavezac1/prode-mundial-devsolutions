type Props = {
  totalPoints: number;
  exactPredictions: number;
  correctPredictions: number;
  totalPredictions: number;
  globalRank: number;
};

export function ProfileStats({
  totalPoints,
  exactPredictions,
  correctPredictions,
  totalPredictions,
  globalRank,
}: Props) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <StatCard label="Posición global" value={`#${globalRank}`} large />
      <StatCard label="Puntos totales" value={totalPoints} large />
      <StatCard label="Exactas (3pts)" value={exactPredictions} />
      <StatCard label="Correctas (1pt)" value={correctPredictions - exactPredictions} />
      <StatCard label="Jugadas" value={totalPredictions} />
    </div>
  );
}

function StatCard({
  label,
  value,
  large,
}: {
  label: string;
  value: string | number;
  large?: boolean;
}) {
  return (
    <div className="rounded-xl border bg-card px-4 py-3 space-y-0.5">
      <p className="text-[11px] text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className={`font-bold tabular-nums ${large ? "text-2xl" : "text-xl"}`}>
        {value}
      </p>
    </div>
  );
}
