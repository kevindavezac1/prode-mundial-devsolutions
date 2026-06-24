"use client";

import { FlagEmoji } from "@/components/match/FlagEmoji";
import type { MatchWithTeams } from "@/types/matches";

// ─── Winner helper ─────────────────────────────────────────────────────────

function winner(m: MatchWithTeams): "home" | "away" | null {
  if (m.status !== "finished") return null;
  if (m.home_score === null || m.away_score === null) return null;
  if (m.penalty_winner === "home" || m.penalty_winner === "away") return m.penalty_winner;
  if (m.home_score > m.away_score) return "home";
  if (m.away_score > m.home_score) return "away";
  return null;
}

// ─── Team row (compact) ────────────────────────────────────────────────────

type Team = MatchWithTeams["home_team"];

function TeamRow({
  team, slot, score, isWinner,
}: {
  team: Team; slot?: string | null; score: number | null; isWinner: boolean;
}) {
  return (
    <div
      className="flex items-center justify-between px-2 py-[5px]"
      style={{ background: isWinner ? "rgba(228,0,43,0.08)" : "transparent" }}
    >
      <div className="flex items-center gap-1.5">
        <div
          className="w-[18px] h-[18px] rounded-full overflow-hidden flex items-center justify-center shrink-0"
          style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}
        >
          {team ? (
            <FlagEmoji code={team.code} flagUrl={team.flag_url}
              className="w-full h-full object-cover" alt={team.name} />
          ) : (
            <span className="text-[7px] font-bold" style={{ color: "rgba(255,255,255,0.2)" }}>?</span>
          )}
        </div>
        <span
          className="text-[10px] font-extrabold"
          style={{
            letterSpacing: "1.2px",
            color: isWinner ? "#E4002B" : team ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.2)",
          }}
        >
          {team ? team.code : (slot ?? "TBD")}
        </span>
      </div>
      <span
        className="text-[12px] font-bold tabular-nums"
        style={{
          color: isWinner ? "white"
            : score !== null ? "rgba(255,255,255,0.55)"
            : "rgba(255,255,255,0.15)",
        }}
      >
        {score !== null ? score : "–"}
      </span>
    </div>
  );
}

// ─── Compact bracket card ──────────────────────────────────────────────────

function BracketCard({ match }: { match: MatchWithTeams }) {
  const w = winner(match);
  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{
        background: "linear-gradient(150deg, #0d1120 0%, #07090f 100%)",
        border: match.status === "live"
          ? "1px solid rgba(228,0,43,0.35)"
          : "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <TeamRow team={match.home_team} slot={match.home_slot}
        score={match.home_score} isWinner={w === "home"} />
      <div style={{ height: 1, background: "rgba(255,255,255,0.055)" }} />
      <TeamRow team={match.away_team} slot={match.away_slot}
        score={match.away_score} isWinner={w === "away"} />
    </div>
  );
}

// ─── Pair of cards + bracket connector arm ─────────────────────────────────

function BracketPair({
  matches, connectorSide,
}: {
  matches: [MatchWithTeams, MatchWithTeams]; connectorSide: "right" | "left";
}) {
  const arm = (
    <div className="w-3 self-stretch flex-shrink-0" style={{ position: "relative" }}>
      <div
        style={{
          position: "absolute",
          top: "22%", bottom: "22%",
          ...(connectorSide === "right"
            ? {
                left: 0, right: "auto",
                borderTop: "1px solid rgba(255,255,255,0.13)",
                borderRight: "1px solid rgba(255,255,255,0.13)",
                borderBottom: "1px solid rgba(255,255,255,0.13)",
              }
            : {
                right: 0, left: "auto",
                borderTop: "1px solid rgba(255,255,255,0.13)",
                borderLeft: "1px solid rgba(255,255,255,0.13)",
                borderBottom: "1px solid rgba(255,255,255,0.13)",
              }),
          width: "100%",
        }}
      />
    </div>
  );

  return (
    <div className="flex gap-0">
      {connectorSide === "left" && arm}
      <div className="flex-1 flex flex-col gap-1.5">
        <BracketCard match={matches[0]} />
        <BracketCard match={matches[1]} />
      </div>
      {connectorSide === "right" && arm}
    </div>
  );
}

// ─── Round section ─────────────────────────────────────────────────────────

const ROUND_LABELS: Record<string, string> = {
  round_of_16:  "16AVOS",
  round_of_8:   "8VOS",
  quarterfinal: "CUARTOS",
  semifinal:    "SEMIS",
};

function RoundSection({
  phase, matches, connectorSide,
}: {
  phase: string; matches: MatchWithTeams[]; connectorSide: "right" | "left";
}) {
  if (matches.length === 0) return null;
  const label = ROUND_LABELS[phase] ?? phase.toUpperCase();

  const pairs: [MatchWithTeams, MatchWithTeams][] = [];
  for (let i = 0; i + 1 < matches.length; i += 2) {
    pairs.push([matches[i], matches[i + 1]]);
  }
  const lone = matches.length % 2 !== 0 ? matches[matches.length - 1] : null;

  return (
    <div>
      <div className="flex items-center gap-3 my-4">
        <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.07)" }} />
        <span
          className="text-[8px] font-bold"
          style={{ color: "rgba(255,255,255,0.2)", letterSpacing: "2.5px" }}
        >
          {label}
        </span>
        <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.07)" }} />
      </div>

      <div className="space-y-4">
        {pairs.map((pair, i) => (
          <BracketPair key={i} matches={pair} connectorSide={connectorSide} />
        ))}
        {lone && <BracketCard match={lone} />}
      </div>
    </div>
  );
}

// ─── Final (prominent) ────────────────────────────────────────────────────

function FinalTeamRow({
  team, slot, score, isWinner,
}: {
  team: Team; slot?: string | null; score: number | null; isWinner: boolean;
}) {
  return (
    <div
      className="flex items-center justify-between px-5 py-4"
      style={{ background: isWinner ? "rgba(228,0,43,0.1)" : "transparent" }}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-9 h-9 rounded-full overflow-hidden flex items-center justify-center shrink-0"
          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)" }}
        >
          {team ? (
            <FlagEmoji code={team.code} flagUrl={team.flag_url}
              className="w-full h-full object-cover" alt={team.name} />
          ) : (
            <span className="text-xl" style={{ color: "rgba(255,255,255,0.2)" }}>?</span>
          )}
        </div>
        <span
          className="text-base font-extrabold"
          style={{
            letterSpacing: "2px",
            color: isWinner ? "#E4002B" : team ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.2)",
          }}
        >
          {team ? team.code : (slot ?? "TBD")}
        </span>
      </div>
      <span
        className="text-3xl font-bold tabular-nums"
        style={{
          color: isWinner ? "white"
            : score !== null ? "rgba(255,255,255,0.6)"
            : "rgba(255,255,255,0.12)",
        }}
      >
        {score !== null ? score : "–"}
      </span>
    </div>
  );
}

function FinalSection({ match }: { match: MatchWithTeams | undefined }) {
  const w = match ? winner(match) : null;

  return (
    <div className="my-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 h-px" style={{ background: "rgba(228,0,43,0.18)" }} />
        <span style={{ fontSize: 18 }}>🏆</span>
        <span
          className="text-[9px] font-extrabold"
          style={{ color: "rgba(228,0,43,0.65)", letterSpacing: "3px" }}
        >
          FINAL
        </span>
        <span style={{ fontSize: 18 }}>🏆</span>
        <div className="flex-1 h-px" style={{ background: "rgba(228,0,43,0.18)" }} />
      </div>

      {match ? (
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: "linear-gradient(150deg, #1a0610 0%, #0d0d1a 50%, #07090f 100%)",
            border: "1px solid rgba(228,0,43,0.22)",
            boxShadow: "0 0 28px rgba(228,0,43,0.07)",
          }}
        >
          <FinalTeamRow team={match.home_team} slot={match.home_slot}
            score={match.home_score} isWinner={w === "home"} />
          <div style={{ height: 1, background: "rgba(228,0,43,0.12)" }} />
          <FinalTeamRow team={match.away_team} slot={match.away_slot}
            score={match.away_score} isWinner={w === "away"} />
        </div>
      ) : (
        <div
          className="rounded-2xl py-10 text-center"
          style={{ background: "rgba(228,0,43,0.04)", border: "1px solid rgba(228,0,43,0.1)" }}
        >
          <p className="text-sm font-bold" style={{ color: "rgba(228,0,43,0.35)", letterSpacing: "2px" }}>
            POR DEFINIR
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Empty state ───────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="text-center py-20">
      <p className="text-4xl mb-4">⏳</p>
      <p className="text-sm font-bold" style={{ color: "rgba(255,255,255,0.2)", letterSpacing: "1.5px" }}>
        LLAVES AÚN NO DEFINIDAS
      </p>
      <p className="text-xs mt-2" style={{ color: "rgba(255,255,255,0.12)" }}>
        Se actualizan al finalizar la fase de grupos
      </p>
    </div>
  );
}

// ─── Main ──────────────────────────────────────────────────────────────────

export function BracketView({ matches }: { matches: MatchWithTeams[] }) {
  if (matches.length === 0) return <div className="px-4 pt-4 pb-8"><EmptyState /></div>;

  const by = (phase: string) =>
    matches.filter((m) => m.phase === phase).sort((a, b) => a.match_number - b.match_number);

  const r16 = by("round_of_16");
  const r8  = by("round_of_8");
  const qf  = by("quarterfinal");
  const sf  = by("semifinal");
  const fin = by("final");

  const h = (arr: MatchWithTeams[]) => Math.ceil(arr.length / 2);

  return (
    <div className="px-4 pt-2 pb-8">
      {/* ── Top half (outside → Final) ─────── */}
      <RoundSection phase="round_of_16" matches={r16.slice(0, h(r16))} connectorSide="right" />
      <RoundSection phase="round_of_8"  matches={r8.slice(0, h(r8))}   connectorSide="right" />
      <RoundSection phase="quarterfinal" matches={qf.slice(0, h(qf))}  connectorSide="right" />
      <RoundSection phase="semifinal"   matches={sf.slice(0, 1)}        connectorSide="right" />

      {/* ── Final ──────────────────────────── */}
      <FinalSection match={fin[0]} />

      {/* ── Bottom half (Final → outside) ──── */}
      <RoundSection phase="semifinal"   matches={sf.slice(1, 2)}        connectorSide="left" />
      <RoundSection phase="quarterfinal" matches={qf.slice(h(qf))}     connectorSide="left" />
      <RoundSection phase="round_of_8"  matches={r8.slice(h(r8))}      connectorSide="left" />
      <RoundSection phase="round_of_16" matches={r16.slice(h(r16))}    connectorSide="left" />
    </div>
  );
}
