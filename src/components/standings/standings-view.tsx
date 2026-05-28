"use client";

import { FlagEmoji } from "@/components/match/FlagEmoji";

export type TeamStanding = {
  team_id: number;
  name: string;
  code: string;
  flag_url: string | null;
  pj: number;
  g: number;
  e: number;
  p: number;
  gf: number;
  gc: number;
  dg: number;
  pts: number;
  tied: boolean;
};

export type GroupStanding = {
  group: string;
  teams: TeamStanding[];
};

type RowStatus = "qualifies" | "possible" | "tied-boundary" | "eliminated";

function getRowStatus(
  idx: number,
  team: TeamStanding,
  groupPhaseComplete: boolean,
  qualifyingSet: Set<number>,
  tiedSet: Set<number>
): RowStatus {
  if (idx < 2) return "qualifies";
  if (idx === 2) {
    if (!groupPhaseComplete) return "possible";
    if (qualifyingSet.has(team.team_id)) return "qualifies";
    if (tiedSet.has(team.team_id)) return "tied-boundary";
    return "eliminated";
  }
  return "eliminated";
}

const STATUS_ROW_BG: Record<RowStatus, string> = {
  "qualifies":      "rgba(34,197,94,0.06)",
  "possible":       "rgba(234,179,8,0.06)",
  "tied-boundary":  "rgba(234,179,8,0.06)",
  "eliminated":     "transparent",
};

const STATUS_POS_BG: Record<RowStatus, string | null> = {
  "qualifies":      "rgba(34,197,94,0.25)",
  "possible":       "rgba(234,179,8,0.25)",
  "tied-boundary":  "rgba(234,179,8,0.25)",
  "eliminated":     null,
};

const STATUS_POS_COLOR: Record<RowStatus, string> = {
  "qualifies":      "#22c55e",
  "possible":       "#eab308",
  "tied-boundary":  "#eab308",
  "eliminated":     "rgba(255,255,255,0.35)",
};

const STATUS_NAME_COLOR: Record<RowStatus, string> = {
  "qualifies":      "rgba(255,255,255,0.95)",
  "possible":       "rgba(255,255,255,0.85)",
  "tied-boundary":  "rgba(255,255,255,0.85)",
  "eliminated":     "rgba(255,255,255,0.5)",
};

const STATUS_PTS_COLOR: Record<RowStatus, string> = {
  "qualifies":      "#ffffff",
  "possible":       "rgba(255,255,255,0.85)",
  "tied-boundary":  "rgba(255,255,255,0.85)",
  "eliminated":     "rgba(255,255,255,0.5)",
};

type GroupTableProps = GroupStanding & {
  groupPhaseComplete: boolean;
  qualifyingSet: Set<number>;
  tiedSet: Set<number>;
};

function GroupTable({ group, teams, groupPhaseComplete, qualifyingSet, tiedSet }: GroupTableProps) {
  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
    >
      <div
        className="px-3 py-2 flex items-center gap-2"
        style={{ background: "rgba(228,0,43,0.12)", borderBottom: "1px solid rgba(255,255,255,0.07)" }}
      >
        <span className="text-xs font-black text-white" style={{ letterSpacing: "2px" }}>
          GRUPO {group}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs" style={{ borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ color: "rgba(255,255,255,0.35)" }}>
              <th className="text-left px-2 py-1.5 font-medium w-6">#</th>
              <th className="text-left px-2 py-1.5 font-medium">Equipo</th>
              <th className="text-center px-1.5 py-1.5 font-medium w-7">PJ</th>
              <th className="text-center px-1.5 py-1.5 font-medium w-7">G</th>
              <th className="text-center px-1.5 py-1.5 font-medium w-7">E</th>
              <th className="text-center px-1.5 py-1.5 font-medium w-7">P</th>
              <th className="text-center px-1.5 py-1.5 font-medium w-8">GF</th>
              <th className="text-center px-1.5 py-1.5 font-medium w-8">GC</th>
              <th className="text-center px-1.5 py-1.5 font-medium w-8">DG</th>
              <th
                className="text-center px-1.5 py-1.5 font-bold w-8"
                style={{ color: "rgba(255,255,255,0.6)" }}
              >
                PTS
              </th>
            </tr>
          </thead>
          <tbody>
            {teams.map((team, idx) => {
              const status = getRowStatus(idx, team, groupPhaseComplete, qualifyingSet, tiedSet);
              const dgStr = team.dg > 0 ? `+${team.dg}` : String(team.dg);
              const posBgColor = STATUS_POS_BG[status];
              const showTiedStar = team.tied || (idx === 2 && status === "tied-boundary");

              return (
                <tr
                  key={team.team_id}
                  style={{
                    borderTop: "1px solid rgba(255,255,255,0.05)",
                    background: STATUS_ROW_BG[status],
                  }}
                >
                  <td className="px-2 py-2 text-center">
                    {posBgColor ? (
                      <span
                        className="inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-bold"
                        style={{ background: posBgColor, color: STATUS_POS_COLOR[status] }}
                      >
                        {idx + 1}
                      </span>
                    ) : (
                      <span style={{ color: STATUS_POS_COLOR[status] }}>{idx + 1}</span>
                    )}
                  </td>
                  <td className="px-2 py-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <FlagEmoji
                        code={team.code}
                        flagUrl={team.flag_url}
                        className="w-4 h-4 rounded-sm object-cover shrink-0"
                        alt={team.name}
                      />
                      <span
                        className="font-medium truncate max-w-[90px]"
                        style={{ color: STATUS_NAME_COLOR[status] }}
                      >
                        {team.name}
                      </span>
                      {showTiedStar && (
                        <span
                          className="text-[9px] shrink-0"
                          style={{ color: "rgba(255,255,255,0.35)" }}
                          title="Empatados en todos los criterios"
                        >
                          *
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-1.5 py-2 text-center" style={{ color: "rgba(255,255,255,0.6)" }}>
                    {team.pj}
                  </td>
                  <td className="px-1.5 py-2 text-center" style={{ color: "rgba(255,255,255,0.6)" }}>
                    {team.g}
                  </td>
                  <td className="px-1.5 py-2 text-center" style={{ color: "rgba(255,255,255,0.6)" }}>
                    {team.e}
                  </td>
                  <td className="px-1.5 py-2 text-center" style={{ color: "rgba(255,255,255,0.6)" }}>
                    {team.p}
                  </td>
                  <td className="px-1.5 py-2 text-center" style={{ color: "rgba(255,255,255,0.6)" }}>
                    {team.gf}
                  </td>
                  <td className="px-1.5 py-2 text-center" style={{ color: "rgba(255,255,255,0.6)" }}>
                    {team.gc}
                  </td>
                  <td
                    className="px-1.5 py-2 text-center font-medium"
                    style={{
                      color:
                        team.dg > 0
                          ? "#22c55e"
                          : team.dg < 0
                          ? "#ef4444"
                          : "rgba(255,255,255,0.6)",
                    }}
                  >
                    {dgStr}
                  </td>
                  <td
                    className="px-1.5 py-2 text-center font-black"
                    style={{ color: STATUS_PTS_COLOR[status] }}
                  >
                    {team.pts}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

type StandingsViewProps = {
  groups: GroupStanding[];
  groupPhaseComplete: boolean;
  qualifyingThirds: number[];
  tiedThirds: number[];
};

export function StandingsView({
  groups,
  groupPhaseComplete,
  qualifyingThirds,
  tiedThirds,
}: StandingsViewProps) {
  const qualifyingSet = new Set(qualifyingThirds);
  const tiedSet = new Set(tiedThirds);

  return (
    <div className="p-4 pb-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {groups.map((g) => (
          <GroupTable
            key={g.group}
            group={g.group}
            teams={g.teams}
            groupPhaseComplete={groupPhaseComplete}
            qualifyingSet={qualifyingSet}
            tiedSet={tiedSet}
          />
        ))}
      </div>

      <div className="mt-4 flex flex-col items-center gap-1">
        <div className="flex items-center gap-3 text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>
          <span>
            <span style={{ color: "#22c55e" }}>■</span> Clasifica a 16avos
          </span>
          <span>
            <span style={{ color: "#eab308" }}>■</span>{" "}
            {groupPhaseComplete ? "Empate en corte" : "Posible clasificación"}
          </span>
        </div>
        <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.2)" }}>
          * empate en todos los criterios
        </p>
      </div>
    </div>
  );
}
