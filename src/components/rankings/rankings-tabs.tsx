"use client";

import { useState } from "react";
import Link from "next/link";

export type RankingEntry = {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  total_points: number;
  exact_predictions: number;
  correct_predictions: number;
  total_predictions: number;
};

export type LeagueRankEntry = {
  id: string;
  name: string;
  my_position: number;
  my_points: number;
  member_count: number;
};

type Props = {
  rankings: RankingEntry[];
  leagueRanks: LeagueRankEntry[];
  userId: string;
  userEntry?: RankingEntry & { rank: number };
};

export function RankingsTabs({ rankings, leagueRanks, userId, userEntry }: Props) {
  const [tab, setTab] = useState<"global" | "ligas">("global");

  return (
    <div className="space-y-4">
      {/* Tab switcher */}
      <div
        className="flex rounded-xl p-1 gap-1"
        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
      >
        {(["global", "ligas"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="flex-1 py-2 rounded-lg text-[11px] font-bold transition-all"
            style={
              tab === t
                ? {
                    background: "linear-gradient(135deg, #E4002B 0%, #B8001F 100%)",
                    color: "white",
                    letterSpacing: "1.5px",
                    boxShadow: "0 2px 12px rgba(228,0,43,0.2)",
                  }
                : {
                    color: "rgba(255,255,255,0.35)",
                    letterSpacing: "1.5px",
                  }
            }
          >
            {t === "global" ? "GLOBAL" : "MIS LIGAS"}
          </button>
        ))}
      </div>

      {tab === "global" && <GlobalTab rankings={rankings} userId={userId} userEntry={userEntry} />}
      {tab === "ligas" && <LeaguesTab leagueRanks={leagueRanks} />}
    </div>
  );
}

function GlobalTab({ rankings, userId, userEntry }: { rankings: RankingEntry[]; userId: string; userEntry?: RankingEntry & { rank: number } }) {
  const userIdx = rankings.findIndex((r) => r.id === userId);

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ border: "1px solid rgba(255,255,255,0.07)" }}
    >
      {/* Header */}
      <div
        className="grid grid-cols-[2rem_1fr_3.5rem_3.5rem] gap-2 px-4 py-2"
        style={{
          background: "rgba(255,255,255,0.03)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        {["#", "JUGADOR", "PTS", "EXACTAS"].map((h, i) => (
          <span
            key={h}
            className={`text-[10px] font-bold ${i >= 2 ? "text-right" : ""}`}
            style={{ color: "rgba(255,255,255,0.25)", letterSpacing: "1px" }}
          >
            {h}
          </span>
        ))}
      </div>

      {rankings.length === 0 && (
        <p className="text-sm text-center py-10" style={{ color: "rgba(255,255,255,0.3)" }}>
          Sin datos todavía.
        </p>
      )}

      {rankings.map((entry, idx) => {
        const isMe = entry.id === userId;
        const medal = idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : null;
        const isTop3 = idx < 3;

        return (
          <Link
            key={entry.id}
            href={`/profile/${entry.username}`}
            className="grid grid-cols-[2rem_1fr_3.5rem_3.5rem] gap-2 px-4 py-3 items-center transition-all active:scale-[0.99]"
            style={{
              borderBottom: "1px solid rgba(255,255,255,0.04)",
              background: isMe ? "rgba(228,0,43,0.06)" : "transparent",
            }}
          >
            <span className="text-sm text-center" style={{ color: "rgba(255,255,255,0.4)" }}>
              {medal ?? (
                <span style={{ color: isMe ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.35)" }}>
                  {idx + 1}
                </span>
              )}
            </span>

            <div className="flex items-center gap-2 min-w-0">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                style={{ background: isMe ? "rgba(228,0,43,0.3)" : "rgba(255,255,255,0.08)" }}
              >
                {entry.display_name[0]?.toUpperCase() ?? "?"}
              </div>
              <span className="text-sm text-white truncate">
                {entry.display_name}
                {isMe && (
                  <span className="ml-1 text-[10px] text-wc-red font-bold"> (vos)</span>
                )}
              </span>
            </div>

            <span
              className="font-display text-base text-right tabular-nums"
              style={{ color: isTop3 ? "#D4AF37" : "rgba(255,255,255,0.8)" }}
            >
              {entry.total_points === 0 ? "—" : entry.total_points}
            </span>

            <span
              className="text-sm text-right tabular-nums"
              style={{ color: "rgba(255,255,255,0.35)" }}
            >
              {entry.exact_predictions === 0 ? "—" : entry.exact_predictions}
            </span>
          </Link>
        );
      })}

      {userIdx === -1 && userEntry && (
        <>
          <div
            className="px-4 py-1.5 flex items-center"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
          >
            <span className="text-xs" style={{ color: "rgba(255,255,255,0.18)" }}>· · ·</span>
          </div>
          <Link
            href={`/profile/${userEntry.username}`}
            className="grid grid-cols-[2rem_1fr_3.5rem_3.5rem] gap-2 px-4 py-3 items-center transition-all active:scale-[0.99]"
            style={{ background: "rgba(228,0,43,0.06)" }}
          >
            <span className="text-sm text-center">
              <span style={{ color: "rgba(255,255,255,0.8)" }}>{userEntry.rank}</span>
            </span>
            <div className="flex items-center gap-2 min-w-0">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                style={{ background: "rgba(228,0,43,0.3)" }}
              >
                {userEntry.display_name[0]?.toUpperCase() ?? "?"}
              </div>
              <span className="text-sm text-white truncate">
                {userEntry.display_name}
                <span className="ml-1 text-[10px] text-wc-red font-bold"> (vos)</span>
              </span>
            </div>
            <span
              className="font-display text-base text-right tabular-nums"
              style={{ color: "rgba(255,255,255,0.8)" }}
            >
              {userEntry.total_points === 0 ? "—" : userEntry.total_points}
            </span>
            <span
              className="text-sm text-right tabular-nums"
              style={{ color: "rgba(255,255,255,0.35)" }}
            >
              {userEntry.exact_predictions === 0 ? "—" : userEntry.exact_predictions}
            </span>
          </Link>
        </>
      )}
    </div>
  );
}

function LeaguesTab({ leagueRanks }: { leagueRanks: LeagueRankEntry[] }) {
  if (leagueRanks.length === 0) {
    return (
      <div
        className="rounded-2xl px-4 py-10 text-center space-y-2"
        style={{ border: "1px solid rgba(255,255,255,0.07)" }}
      >
        <p className="text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>
          No estás en ninguna liga.
        </p>
        <Link
          href="/leagues"
          className="text-sm text-wc-red font-bold inline-block"
        >
          Crear o unirte a una →
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {leagueRanks.map((league) => (
        <Link
          key={league.id}
          href={`/leagues/${league.id}`}
          className="flex items-center justify-between rounded-2xl px-4 py-3.5 transition-all active:scale-[0.98]"
          style={{
            background: "linear-gradient(160deg, #0d1120 0%, #07090f 100%)",
            border: "1px solid rgba(255,255,255,0.07)",
          }}
        >
          <div className="min-w-0">
            <p className="font-bold text-sm text-white truncate">{league.name}</p>
            <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>
              {league.member_count} miembro{league.member_count !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="text-right shrink-0 ml-3">
            <p className="font-display text-lg text-white">#{league.my_position}</p>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
              {league.my_points === 0 ? "— pts" : `${league.my_points} pts`}
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}