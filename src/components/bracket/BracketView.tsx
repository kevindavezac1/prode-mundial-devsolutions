"use client";

import { useState } from "react";
import { FlagEmoji } from "@/components/match/FlagEmoji";
import type { MatchWithTeams } from "@/types/matches";

// ─── Layout constants ─────────────────────────────────────────────────────────

const CARD_H  = 46;              // px — height of each compact match card
const SLOT    = 58;              // px — vertical spacing per R16 slot
const MID_GAP = 16;             // px — visual break between top-4 and bottom-4 R16
const TOTAL_H = SLOT * 8 + MID_GAP; // 480px — full column height
const CONN_W  = 11;             // px — width of connector columns
const LINE    = "rgba(255,255,255,0.11)";

// Vertical position helpers (all px, relative to column top)
function r16Top(i: number) { return i * SLOT + (i >= 4 ? MID_GAP : 0); }
function r16C(i: number)   { return r16Top(i) + CARD_H / 2; }
function r8Top(i: number)  { return (r16C(i * 2) + r16C(i * 2 + 1)) / 2 - CARD_H / 2; }
function r8C(i: number)    { return r8Top(i) + CARD_H / 2; }
function qfTop(i: number)  { return (r8C(i * 2) + r8C(i * 2 + 1)) / 2 - CARD_H / 2; }
function qfC(i: number)    { return qfTop(i) + CARD_H / 2; }
const SF_TOP = (qfC(0) + qfC(1)) / 2 - CARD_H / 2;
const SF_C   = SF_TOP + CARD_H / 2;

// ─── Winner helper ────────────────────────────────────────────────────────────

function matchWinner(m: MatchWithTeams): "home" | "away" | null {
  if (m.status !== "finished") return null;
  if (m.home_score === null || m.away_score === null) return null;
  if (m.penalty_winner === "home") return "home";
  if (m.penalty_winner === "away") return "away";
  if (m.home_score > m.away_score) return "home";
  if (m.away_score > m.home_score) return "away";
  return null;
}

// ─── Compact team row ─────────────────────────────────────────────────────────

type Team = MatchWithTeams["home_team"];

function abbreviateSlot(slot: string): string {
  const m = slot.match(/^(\d+)\D+([A-Z])$/i); // "1ro Grupo A" → "1A"
  if (m) return `${m[1]}${m[2].toUpperCase()}`;
  if (/mejor/i.test(slot)) return "M3";
  return slot.slice(0, 3);
}

function TeamRow({ team, slot, score, isWinner, phase }: {
  team: Team;
  slot?: string | null;
  score: number | null;
  isWinner: boolean;
  phase: string;
}) {
  const label = team
    ? team.code
    : slot && phase === "round_of_16"
      ? abbreviateSlot(slot)
      : "?";

  return (
    <div
      className="flex items-center justify-between px-[6px] flex-1 min-w-0"
      style={{ background: isWinner ? "rgba(228,0,43,0.09)" : "transparent" }}
    >
      <div className="flex items-center gap-[4px] min-w-0">
        <div
          className="shrink-0 rounded-full overflow-hidden flex items-center justify-center"
          style={{
            width: 13, height: 13,
            background: "rgba(255,255,255,0.07)",
            border: "1px solid rgba(255,255,255,0.09)",
          }}
        >
          {team ? (
            <FlagEmoji code={team.code} flagUrl={team.flag_url}
              className="w-full h-full object-cover" alt={team.name} />
          ) : (
            <span className="text-[5px] font-bold" style={{ color: "rgba(255,255,255,0.15)" }}>?</span>
          )}
        </div>
        <span
          className="text-[8px] font-extrabold truncate"
          style={{
            letterSpacing: "0.6px",
            color: isWinner ? "#E4002B"
              : team ? "rgba(255,255,255,0.72)"
              : "rgba(255,255,255,0.18)",
          }}
        >
          {label}
        </span>
      </div>
      <span
        className="text-[11px] font-bold tabular-nums shrink-0 ml-1"
        style={{
          color: isWinner ? "white"
            : score !== null ? "rgba(255,255,255,0.5)"
            : "rgba(255,255,255,0.11)",
        }}
      >
        {score !== null ? score : "–"}
      </span>
    </div>
  );
}

// ─── Compact bracket card (absolutely positioned) ──────────────────────────────

function BCard({ match, top, phase }: { match: MatchWithTeams | undefined; top: number; phase: string }) {
  const w = match ? matchWinner(match) : null;
  return (
    <div
      style={{
        position: "absolute",
        top,
        left: 0,
        right: 0,
        height: CARD_H,
        borderRadius: 6,
        overflow: "hidden",
        background: "linear-gradient(150deg, #0d1120 0%, #07090f 100%)",
        border: `1px solid ${match?.status === "live" ? "rgba(228,0,43,0.45)" : LINE}`,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <TeamRow
        team={match?.home_team ?? null}
        slot={match?.home_slot}
        score={match?.home_score ?? null}
        isWinner={w === "home"}
        phase={phase}
      />
      <div style={{ height: 1, background: "rgba(255,255,255,0.04)", flexShrink: 0 }} />
      <TeamRow
        team={match?.away_team ?? null}
        slot={match?.away_slot}
        score={match?.away_score ?? null}
        isWinner={w === "away"}
        phase={phase}
      />
    </div>
  );
}

// ─── Connector column ─────────────────────────────────────────────────────────

type ConnLine = { top: number; height: number; isVertical: boolean };

function ConnectorCol({ lines, mirrored }: { lines: ConnLine[]; mirrored?: boolean }) {
  return (
    <div style={{ position: "relative", height: TOTAL_H, width: CONN_W, flexShrink: 0 }}>
      {lines.map((l, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            top: l.top,
            left: l.isVertical ? (mirrored ? "auto" : 0) : 0,
            right: l.isVertical ? (mirrored ? 0 : "auto") : 0,
            width: l.isVertical ? 1 : "100%",
            height: l.isVertical ? l.height : 1,
            background: LINE,
          }}
        />
      ))}
    </div>
  );
}

// ─── Round column ─────────────────────────────────────────────────────────────

function RoundCol({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ position: "relative", height: TOTAL_H, flex: 1, minWidth: 0 }}>
      {children}
    </div>
  );
}

// ─── Half bracket ─────────────────────────────────────────────────────────────

function HalfBracket({ r16, r8, qf, sf, reversed }: {
  r16: MatchWithTeams[];
  r8:  MatchWithTeams[];
  qf:  MatchWithTeams[];
  sf:  MatchWithTeams | undefined;
  reversed?: boolean;
}) {
  const pad = (arr: MatchWithTeams[], len: number): (MatchWithTeams | undefined)[] =>
    Array.from({ length: len }, (_, i) => arr[i]);

  // R16 → R8 connectors
  const r16r8: ConnLine[] = [];
  for (let i = 0; i < 4; i++) {
    r16r8.push({ top: r16C(i * 2), height: r16C(i * 2 + 1) - r16C(i * 2), isVertical: true });
    r16r8.push({ top: r8C(i), height: 1, isVertical: false });
  }

  // R8 → QF connectors
  const r8qf: ConnLine[] = [];
  for (let i = 0; i < 2; i++) {
    r8qf.push({ top: r8C(i * 2), height: r8C(i * 2 + 1) - r8C(i * 2), isVertical: true });
    r8qf.push({ top: qfC(i), height: 1, isVertical: false });
  }

  // QF → SF connectors
  const qfsf: ConnLine[] = [
    { top: qfC(0), height: qfC(1) - qfC(0), isVertical: true },
    { top: SF_C, height: 1, isVertical: false },
  ];

  if (reversed) {
    return (
      <div style={{ display: "flex" }}>
        <RoundCol>
          <BCard match={sf} top={SF_TOP} phase="semifinal" />
        </RoundCol>
        <ConnectorCol lines={qfsf} mirrored />
        <RoundCol>
          {pad(qf, 2).map((m, i) => <BCard key={i} match={m} top={qfTop(i)} phase="quarterfinal" />)}
        </RoundCol>
        <ConnectorCol lines={r8qf} mirrored />
        <RoundCol>
          {pad(r8, 4).map((m, i) => <BCard key={i} match={m} top={r8Top(i)} phase="round_of_8" />)}
        </RoundCol>
        <ConnectorCol lines={r16r8} mirrored />
        <RoundCol>
          {pad(r16, 8).map((m, i) => <BCard key={i} match={m} top={r16Top(i)} phase="round_of_16" />)}
        </RoundCol>
      </div>
    );
  }

  return (
    <div style={{ display: "flex" }}>
      <RoundCol>
        {pad(r16, 8).map((m, i) => <BCard key={i} match={m} top={r16Top(i)} phase="round_of_16" />)}
      </RoundCol>
      <ConnectorCol lines={r16r8} />
      <RoundCol>
        {pad(r8, 4).map((m, i) => <BCard key={i} match={m} top={r8Top(i)} phase="round_of_8" />)}
      </RoundCol>
      <ConnectorCol lines={r8qf} />
      <RoundCol>
        {pad(qf, 2).map((m, i) => <BCard key={i} match={m} top={qfTop(i)} phase="quarterfinal" />)}
      </RoundCol>
      <ConnectorCol lines={qfsf} />
      <RoundCol>
        <BCard match={sf} top={SF_TOP} phase="semifinal" />
      </RoundCol>
    </div>
  );
}

// ─── Side toggle ──────────────────────────────────────────────────────────────

function SideToggle({ side, onChange }: {
  side: "A" | "B";
  onChange: (s: "A" | "B") => void;
}) {
  return (
    <div
      className="flex gap-1 p-1 rounded-xl mb-4"
      style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.07)",
      }}
    >
      {(["A", "B"] as const).map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onChange(s)}
          className="flex-1 py-2 rounded-lg text-[11px] font-extrabold transition-all active:scale-95"
          style={{
            letterSpacing: "2px",
            background: side === s
              ? "linear-gradient(135deg, #E4002B 0%, #B8001F 100%)"
              : "transparent",
            color: side === s ? "white" : "rgba(255,255,255,0.3)",
            boxShadow: side === s ? "0 2px 8px rgba(228,0,43,0.25)" : "none",
          }}
        >
          LADO {s}
        </button>
      ))}
    </div>
  );
}

// ─── Column labels ────────────────────────────────────────────────────────────

function ColLabels({ reversed }: { reversed?: boolean }) {
  const COL_LABELS = reversed
    ? (["SEMIS", "CUARTOS", "8VOS", "16AVOS"] as const)
    : (["16AVOS", "8VOS", "CUARTOS", "SEMIS"] as const);
  return (
    <div style={{ display: "flex", marginBottom: 6 }}>
      {COL_LABELS.map((label, i) => (
        <div key={label} style={{ display: "contents" }}>
          {i > 0 && <div style={{ width: CONN_W, flexShrink: 0 }} />}
          <div style={{ flex: 1, minWidth: 0, textAlign: "center" }}>
            <span
              className="text-[7px] font-bold"
              style={{ color: "rgba(255,255,255,0.18)", letterSpacing: "1.5px" }}
            >
              {label}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Special match card (Final / 3er puesto) ──────────────────────────────────

function SpecialTeamRow({ team, slot, score, isWinner }: {
  team: Team; slot?: string | null; score: number | null; isWinner: boolean;
}) {
  return (
    <div
      className="flex items-center justify-between px-4 py-3"
      style={{ background: isWinner ? "rgba(228,0,43,0.09)" : "transparent" }}
    >
      <div className="flex items-center gap-3">
        <div
          className="rounded-full overflow-hidden flex items-center justify-center shrink-0"
          style={{
            width: 30, height: 30,
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          {team ? (
            <FlagEmoji code={team.code} flagUrl={team.flag_url}
              className="w-full h-full object-cover" alt={team.name} />
          ) : (
            <span style={{ color: "rgba(255,255,255,0.18)", fontSize: 13 }}>?</span>
          )}
        </div>
        <span
          className="font-extrabold text-sm"
          style={{
            letterSpacing: "1.5px",
            color: isWinner ? "#E4002B"
              : team ? "rgba(255,255,255,0.82)"
              : "rgba(255,255,255,0.2)",
          }}
        >
          {team ? team.name : (slot ?? "POR DEFINIR")}
        </span>
      </div>
      <span
        className="font-bold text-xl tabular-nums"
        style={{
          color: isWinner ? "white"
            : score !== null ? "rgba(255,255,255,0.55)"
            : "rgba(255,255,255,0.12)",
        }}
      >
        {score !== null ? score : "–"}
      </span>
    </div>
  );
}

function SpecialMatch({ match, label, accentRgb }: {
  match: MatchWithTeams | undefined;
  label: string;
  accentRgb: string;
}) {
  const w = match ? matchWinner(match) : null;
  return (
    <div className="mt-5">
      <div className="flex items-center gap-3 mb-3">
        <div className="flex-1 h-px" style={{ background: `rgba(${accentRgb},0.18)` }} />
        <span
          className="text-[9px] font-extrabold"
          style={{ color: `rgba(${accentRgb},0.65)`, letterSpacing: "2.5px" }}
        >
          {label}
        </span>
        <div className="flex-1 h-px" style={{ background: `rgba(${accentRgb},0.18)` }} />
      </div>
      {match ? (
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: "linear-gradient(150deg, #0d1120 0%, #07090f 100%)",
            border: `1px solid rgba(${accentRgb},0.22)`,
          }}
        >
          <SpecialTeamRow team={match.home_team} slot={match.home_slot}
            score={match.home_score} isWinner={w === "home"} />
          <div style={{ height: 1, background: `rgba(${accentRgb},0.1)` }} />
          <SpecialTeamRow team={match.away_team} slot={match.away_slot}
            score={match.away_score} isWinner={w === "away"} />
        </div>
      ) : (
        <div
          className="rounded-2xl py-5 text-center"
          style={{
            background: `rgba(${accentRgb},0.03)`,
            border: `1px solid rgba(${accentRgb},0.1)`,
          }}
        >
          <p className="text-xs font-bold" style={{ color: `rgba(${accentRgb},0.3)`, letterSpacing: "2px" }}>
            POR DEFINIR
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

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

// ─── Main ─────────────────────────────────────────────────────────────────────

export function BracketView({ matches }: { matches: MatchWithTeams[] }) {
  const [side, setSide] = useState<"A" | "B">("A");

  const by = (phase: string) =>
    matches.filter((m) => m.phase === phase).sort((a, b) => a.match_number - b.match_number);

  const r16All = by("round_of_16");

  if (r16All.length === 0) {
    return <div className="px-4 pt-4 pb-8"><EmptyState /></div>;
  }

  const r8All  = by("round_of_8");
  const qfAll  = by("quarterfinal");
  const sfAll  = by("semifinal");
  const finAll = by("final");
  const tpAll  = by("third_place");

  const h = (arr: MatchWithTeams[]) => Math.ceil(arr.length / 2);

  const sideA = {
    r16: r16All.slice(0, h(r16All)),
    r8:  r8All.slice(0, h(r8All)),
    qf:  qfAll.slice(0, h(qfAll)),
    sf:  sfAll[0],
  };
  const sideB = {
    r16: r16All.slice(h(r16All)),
    r8:  r8All.slice(h(r8All)),
    qf:  qfAll.slice(h(qfAll)),
    sf:  sfAll[1],
  };

  const active = side === "A" ? sideA : sideB;

  return (
    <div className="px-4 pt-4 pb-8">
      <SideToggle side={side} onChange={setSide} />
      <ColLabels reversed={side === "B"} />
      <HalfBracket
        r16={active.r16}
        r8={active.r8}
        qf={active.qf}
        sf={active.sf}
        reversed={side === "B"}
      />
      <SpecialMatch match={tpAll[0]} label="3ER PUESTO" accentRgb="212,175,55" />
      <SpecialMatch match={finAll[0]} label="🏆 FINAL 🏆" accentRgb="228,0,43" />
    </div>
  );
}
