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
    <div
      className="rounded-2xl px-4 py-3 space-y-0.5"
      style={{
        background: "linear-gradient(160deg, #0d1120 0%, #07090f 100%)",
        border: "1px solid rgba(255,255,255,0.07)",
      }}
    >
      <p
        className="text-[10px] font-bold uppercase"
        style={{ color: "rgba(255,255,255,0.35)", letterSpacing: "1.5px" }}
      >
        {label}
      </p>
      <p className={`font-bold tabular-nums text-white ${large ? "text-2xl" : "text-xl"}`}>
        {value}
      </p>
    </div>
  );
}
