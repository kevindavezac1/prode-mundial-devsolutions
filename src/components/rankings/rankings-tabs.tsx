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
};

export function RankingsTabs({ rankings, leagueRanks, userId }: Props) {
  const [tab, setTab] = useState<"global" | "ligas">("global");

  return (
    <div className="space-y-4">
      {/* Tab switcher */}
      <div className="flex rounded-lg bg-muted p-1 gap-1">
        {(["global", "ligas"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
              tab === t
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t === "global" ? "Global" : "Mis ligas"}
          </button>
        ))}
      </div>

      {tab === "global" && (
        <GlobalTab rankings={rankings} userId={userId} />
      )}
      {tab === "ligas" && (
        <LeaguesTab leagueRanks={leagueRanks} />
      )}
    </div>
  );
}

function GlobalTab({ rankings, userId }: { rankings: RankingEntry[]; userId: string }) {
  const userIdx = rankings.findIndex((r) => r.id === userId);

  return (
    <div className="rounded-xl border overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-[2rem_1fr_3rem_3rem] gap-2 px-3 py-2 bg-muted/60 border-b">
        <span className="text-[11px] font-semibold text-muted-foreground text-center">#</span>
        <span className="text-[11px] font-semibold text-muted-foreground">Jugador</span>
        <span className="text-[11px] font-semibold text-muted-foreground text-right">Pts</span>
        <span className="text-[11px] font-semibold text-muted-foreground text-right">Exactos</span>
      </div>

      {rankings.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">Sin datos todavía.</p>
      )}

      {rankings.map((entry, idx) => {
        const isMe = entry.id === userId;
        const medal = idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : null;

        return (
          <Link
            key={entry.id}
            href={`/profile/${entry.username}`}
            className={`grid grid-cols-[2rem_1fr_3rem_3rem] gap-2 px-3 py-2.5 border-b last:border-b-0 items-center hover:bg-muted/40 transition-colors ${
              isMe ? "bg-primary/8 font-semibold" : ""
            }`}
          >
            <span className="text-sm text-center text-muted-foreground">
              {medal ?? idx + 1}
            </span>
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-xs font-bold shrink-0">
                {entry.display_name[0]?.toUpperCase() ?? "?"}
              </div>
              <span className="text-sm truncate">
                {entry.display_name}
                {isMe && <span className="ml-1 text-xs text-primary font-normal">(vos)</span>}
              </span>
            </div>
            <span className="text-sm text-right tabular-nums">
              {entry.total_points === 0 ? "—" : entry.total_points}
            </span>
            <span className="text-sm text-right tabular-nums text-muted-foreground">
              {entry.exact_predictions === 0 ? "—" : entry.exact_predictions}
            </span>
          </Link>
        );
      })}

      {/* User not in top 100 — show their row at bottom */}
      {userIdx === -1 && (
        <div className="border-t-2 border-dashed border-muted px-3 py-2.5">
          <p className="text-xs text-muted-foreground text-center">Tu posición está fuera del top 100</p>
        </div>
      )}
    </div>
  );
}

function LeaguesTab({ leagueRanks }: { leagueRanks: LeagueRankEntry[] }) {
  if (leagueRanks.length === 0) {
    return (
      <div className="rounded-xl border px-4 py-10 text-center">
        <p className="text-sm text-muted-foreground">No estás en ninguna liga.</p>
        <Link href="/leagues" className="text-sm text-primary hover:underline mt-2 inline-block">
          Crear o unirte a una
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
          className="flex items-center justify-between rounded-xl border bg-card px-4 py-3 hover:bg-muted/50 transition-colors"
        >
          <div className="min-w-0">
            <p className="font-semibold text-sm truncate">{league.name}</p>
            <p className="text-xs text-muted-foreground">
              {league.member_count} miembro{league.member_count !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="text-right shrink-0 ml-3">
            <p className="text-sm font-bold">
              #{league.my_position}
            </p>
            <p className="text-xs text-muted-foreground">
              {league.my_points === 0 ? "— pts" : `${league.my_points} pts`}
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}
