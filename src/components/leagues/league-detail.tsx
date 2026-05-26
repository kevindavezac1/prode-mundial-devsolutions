"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { LeagueDetail, LeagueMember } from "@/types/leagues";

type Props = { league: LeagueDetail; userId: string };

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export function LeagueDetailView({ league, userId }: Props) {
  const inviteLink = `${siteUrl}/join/${league.invite_code}`;
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      toast.success("Link copiado");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("No se pudo copiar");
    }
  }

  return (
    <div className="space-y-6">
      {/* Invite section */}
      <div className="rounded-xl border bg-card px-4 py-3 space-y-2">
        <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">
          Invitar amigos
        </p>
        <div className="flex items-center gap-2">
          <code className="flex-1 text-sm font-mono bg-muted rounded-md px-2 py-1 truncate">
            {league.invite_code}
          </code>
          <Button size="sm" variant="outline" onClick={copyLink}>
            {copied ? "✓ Copiado" : "Copiar link"}
          </Button>
        </div>
        <p className="text-[11px] text-muted-foreground break-all">{inviteLink}</p>
      </div>

      {/* Leaderboard */}
      <div className="space-y-1">
        <h2 className="text-xs text-muted-foreground uppercase tracking-wide font-semibold px-1">
          Tabla de posiciones
        </h2>
        <div className="rounded-xl border overflow-hidden">
          {league.members.map((member, idx) => (
            <MemberRow
              key={member.user_id}
              member={member}
              position={idx + 1}
              isMe={member.user_id === userId}
            />
          ))}
          {league.members.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-6">Sin miembros.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function MemberRow({
  member,
  position,
  isMe,
}: {
  member: LeagueMember;
  position: number;
  isMe: boolean;
}) {
  const medal = position === 1 ? "🥇" : position === 2 ? "🥈" : position === 3 ? "🥉" : null;

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 border-b last:border-b-0 ${
        isMe ? "bg-primary/5" : ""
      }`}
    >
      <span className="w-6 text-center text-sm font-semibold text-muted-foreground shrink-0">
        {medal ?? position}
      </span>
      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0 text-sm font-bold">
        {member.display_name[0]?.toUpperCase() ?? "?"}
      </div>
      <p className="flex-1 text-sm font-medium truncate">
        {member.display_name}
        {isMe && <span className="ml-1 text-xs text-primary">(vos)</span>}
      </p>
      <span className="text-sm font-bold tabular-nums shrink-0">{member.total_points} pts</span>
    </div>
  );
}
