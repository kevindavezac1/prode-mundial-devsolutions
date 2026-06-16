type Props = {
  totalPoints: number;
  exactPredictions: number;
  correctPredictions: number;
  totalPredictions: number;
  globalRank: number;
  periodLabel?: string;
  periodPoints?: number;
};

export function ProfileStats({
  totalPoints,
  exactPredictions,
  correctPredictions,
  totalPredictions,
  globalRank,
  periodLabel,
  periodPoints,
}: Props) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <StatCard label="POSICIÓN GLOBAL" value={`#${globalRank}`} large accent />
      <StatCard label="PUNTOS TOTALES" value={totalPoints} large gold />
      <StatCard label="EXACTAS" value={exactPredictions} hint="+300 pts" />
      <StatCard label="CORRECTAS" value={correctPredictions - exactPredictions} hint="+100 pts" />
      <StatCard label="JUGADAS" value={totalPredictions} />
      {periodLabel !== undefined && periodPoints !== undefined && (
        <StatCard label={`PTS ${periodLabel}`} value={periodPoints} />
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  large,
  gold,
  accent,
  hint,
}: {
  label: string;
  value: string | number;
  large?: boolean;
  gold?: boolean;
  accent?: boolean;
  hint?: string;
}) {
  return (
    <div
      className="rounded-2xl px-4 py-3.5 space-y-1"
      style={{
        background: accent
          ? "linear-gradient(135deg, rgba(228,0,43,0.12) 0%, rgba(7,9,15,1) 100%)"
          : "linear-gradient(160deg, #0d1120 0%, #07090f 100%)",
        border: accent
          ? "1px solid rgba(228,0,43,0.2)"
          : gold
          ? "1px solid rgba(212,175,55,0.2)"
          : "1px solid rgba(255,255,255,0.07)",
      }}
    >
      <p
        className="text-[10px] font-bold"
        style={{ color: "rgba(255,255,255,0.3)", letterSpacing: "1.5px" }}
      >
        {label}
      </p>
      <p
        className={`font-display tabular-nums leading-none ${large ? "text-3xl" : "text-2xl"}`}
        style={{
          color: gold ? "#D4AF37" : accent ? "#ff4d6d" : "white",
        }}
      >
        {value}
      </p>
      {hint && (
        <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.2)" }}>
          {hint}
        </p>
      )}
    </div>
  );
}