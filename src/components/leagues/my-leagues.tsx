"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { League } from "@/types/leagues";

type Props = { leagues: League[]; userId: string };

export function MyLeagues({ leagues, userId }: Props) {
  const router = useRouter();
  const [panel, setPanel] = useState<"none" | "create" | "join">("none");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [isPending, startTransition] = useTransition();

  function togglePanel(next: "create" | "join") {
    setPanel((p) => (p === next ? "none" : next));
    setName("");
    setCode("");
  }

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await fetch("/api/leagues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const body = await res.json();
      if (!res.ok) { toast.error(body.error ?? "Error al crear liga"); return; }
      toast.success("Liga creada");
      router.push(`/leagues/${body.data.id}`);
    });
  }

  function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await fetch("/api/leagues/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invite_code: code }),
      });
      const body = await res.json();
      if (!res.ok) { toast.error(body.error ?? "Error al unirse"); return; }
      toast.success("Te uniste a la liga");
      router.push(`/leagues/${body.data.league_id}`);
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button
          size="sm"
          variant={panel === "create" ? "default" : "outline"}
          className="flex-1"
          onClick={() => togglePanel("create")}
          disabled={isPending}
        >
          + Crear liga
        </Button>
        <Button
          size="sm"
          variant={panel === "join" ? "default" : "outline"}
          className="flex-1"
          onClick={() => togglePanel("join")}
          disabled={isPending}
        >
          Unirme con código
        </Button>
      </div>

      {panel === "create" && (
        <form onSubmit={handleCreate} className="rounded-xl border bg-card p-4 space-y-3">
          <p className="text-sm font-semibold">Nueva liga</p>
          <div className="space-y-1">
            <Label htmlFor="league-name">Nombre</Label>
            <Input
              id="league-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Los de la oficina"
              maxLength={50}
              disabled={isPending}
            />
          </div>
          <Button type="submit" className="w-full" disabled={isPending || name.trim().length < 2}>
            {isPending ? "Creando…" : "Crear"}
          </Button>
        </form>
      )}

      {panel === "join" && (
        <form onSubmit={handleJoin} className="rounded-xl border bg-card p-4 space-y-3">
          <p className="text-sm font-semibold">Unirme a liga</p>
          <div className="space-y-1">
            <Label htmlFor="invite-code">Código de invitación</Label>
            <Input
              id="invite-code"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="Ej: AB12CD34"
              maxLength={12}
              disabled={isPending}
            />
          </div>
          <Button type="submit" className="w-full" disabled={isPending || code.trim().length < 4}>
            {isPending ? "Uniéndome…" : "Unirme"}
          </Button>
        </form>
      )}

      {leagues.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          No estás en ninguna liga todavía.
        </p>
      ) : (
        <div className="space-y-2">
          {leagues.map((league) => (
            <Link
              key={league.id}
              href={`/leagues/${league.id}`}
              className="flex items-center justify-between rounded-xl border bg-card px-4 py-3 hover:bg-muted/50 transition-colors"
            >
              <div className="min-w-0">
                <p className="font-semibold text-sm truncate">{league.name}</p>
                <p className="text-xs text-muted-foreground">
                  {league.member_count ?? 0} / {league.max_members} miembros
                  {league.owner_id === userId && (
                    <span className="ml-2 text-primary">· Admin</span>
                  )}
                </p>
              </div>
              <span className="text-muted-foreground text-sm ml-2">›</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
