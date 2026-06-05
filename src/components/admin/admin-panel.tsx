"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { submitResult, toggleSponsorActive, uploadSponsorLogo } from "@/app/(protected)/admin/actions";
import { FlagEmoji } from "@/components/match/FlagEmoji";
import type { MatchWithTeams } from "@/types/matches";

export type Sponsor = {
  id: string;
  nombre: string;
  logo_url: string | null;
  descripcion: string | null;
  link_url: string | null;
  activo: boolean;
  orden: number;
};

type Props = { matches: MatchWithTeams[]; sponsors: Sponsor[] };

function getMatchDate(scheduledAt: string): string {
  return new Date(scheduledAt).toLocaleDateString("sv-SE", {
    timeZone: "America/Argentina/Buenos_Aires",
  });
}

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00Z");
  return d.toLocaleDateString("es-AR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function MatchTime({ scheduledAt }: { scheduledAt: string }) {
  const [text, setText] = useState<string | null>(null);
  useEffect(() => {
    setText(
      new Date(scheduledAt).toLocaleTimeString("es-AR", {
        hour: "2-digit",
        minute: "2-digit",
      })
    );
  }, [scheduledAt]);
  return <>{text ?? "–"}</>;
}

function StatusBadge({ status }: { status: MatchWithTeams["status"] }) {
  if (status === "live") {
    return (
      <span
        className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
        style={{
          background: "rgba(228,0,43,0.15)",
          color: "#E4002B",
          border: "1px solid rgba(228,0,43,0.3)",
        }}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shrink-0" />
        EN VIVO
      </span>
    );
  }
  if (status === "finished") {
    return (
      <span
        className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
        style={{
          background: "rgba(34,197,94,0.1)",
          color: "#4ade80",
          border: "1px solid rgba(34,197,94,0.2)",
        }}
      >
        ✓ Finalizado
      </span>
    );
  }
  if (status === "cancelled") {
    return (
      <span
        className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full"
        style={{
          background: "rgba(255,255,255,0.05)",
          color: "rgba(255,255,255,0.3)",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        Cancelado
      </span>
    );
  }
  return (
    <span
      className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
      style={{
        background: "rgba(251,146,60,0.1)",
        color: "rgba(251,146,60,0.85)",
        border: "1px solid rgba(251,146,60,0.2)",
      }}
    >
      ● Pendiente
    </span>
  );
}

function SponsorForm({
  mode,
  sponsor,
  onSuccess,
  onCancel,
}: {
  mode: "create" | "edit";
  sponsor?: Sponsor;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const [nombre, setNombre] = useState(sponsor?.nombre ?? "");
  const [descripcion, setDescripcion] = useState(sponsor?.descripcion ?? "");
  const [linkUrl, setLinkUrl] = useState(sponsor?.link_url ?? "");
  const [activo, setActivo] = useState(sponsor?.activo ?? true);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>(sponsor?.logo_url ?? "");
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) { toast.error("Usá jpg, png o webp."); return; }
    if (file.size > 2 * 1024 * 1024) { toast.error("El archivo supera 2MB."); return; }
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
    e.target.value = "";
  }

  async function handleSubmit() {
    if (!nombre.trim()) { toast.error("El nombre es requerido."); return; }
    setSubmitting(true);
    try {
      let sponsorId = sponsor?.id;

      if (mode === "create") {
        const res = await fetch("/api/admin/sponsors", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nombre: nombre.trim(), descripcion: descripcion.trim() || null, link_url: linkUrl.trim() || null, activo }),
        });
        const json = await res.json();
        if (!res.ok) { toast.error(json.error ?? "Error al crear."); return; }
        sponsorId = json.data.id;
      } else {
        const res = await fetch(`/api/admin/sponsors/${sponsorId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nombre: nombre.trim(), descripcion: descripcion.trim() || null, link_url: linkUrl.trim() || null, activo }),
        });
        const json = await res.json();
        if (!res.ok) { toast.error(json.error ?? "Error al guardar."); return; }
      }

      if (logoFile && sponsorId) {
        const fd = new FormData();
        fd.append("logo", logoFile);
        const result = await uploadSponsorLogo(sponsorId, fd);
        if ("error" in result) { toast.error(result.error); return; }
      }

      toast.success(mode === "create" ? "Sponsor creado." : "Sponsor guardado.");
      onSuccess();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="rounded-2xl p-4 space-y-3"
      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}
    >
      <p className="font-bold text-sm text-white">
        {mode === "create" ? "Nuevo sponsor" : "Editar sponsor"}
      </p>

      {/* Logo */}
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => fileRef.current?.click()} className="shrink-0">
          <div
            className="w-14 h-14 rounded-xl flex items-center justify-center overflow-hidden"
            style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}
          >
            {logoPreview ? (
              <img src={logoPreview} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-xs text-center leading-tight px-1" style={{ color: "rgba(255,255,255,0.35)" }}>
                + Logo
              </span>
            )}
          </div>
        </button>
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleLogoChange} />
        <p className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
          {logoFile ? logoFile.name : "jpg, png o webp · máx 2MB"}
        </p>
      </div>

      {/* Nombre */}
      <div>
        <label className="text-[10px] font-bold" style={{ color: "rgba(255,255,255,0.35)", letterSpacing: "1px" }}>NOMBRE *</label>
        <input
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          className="mt-1 w-full rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
          style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}
          placeholder="Nombre del sponsor"
        />
      </div>

      {/* Descripción */}
      <div>
        <label className="text-[10px] font-bold" style={{ color: "rgba(255,255,255,0.35)", letterSpacing: "1px" }}>DESCRIPCIÓN / OFERTA</label>
        <input
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          className="mt-1 w-full rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
          style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}
          placeholder="20% off mostrando tu puntaje"
        />
      </div>

      {/* Link */}
      <div>
        <label className="text-[10px] font-bold" style={{ color: "rgba(255,255,255,0.35)", letterSpacing: "1px" }}>LINK URL</label>
        <input
          value={linkUrl}
          onChange={(e) => setLinkUrl(e.target.value)}
          className="mt-1 w-full rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
          style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}
          placeholder="https://instagram.com/..."
          type="url"
        />
      </div>

      {/* Activo */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-white">Activo al crear</span>
        <button
          type="button"
          onClick={() => setActivo((v) => !v)}
          className="w-11 h-6 rounded-full relative transition-colors"
          style={{ background: activo ? "rgba(74,172,223,0.6)" : "rgba(255,255,255,0.1)" }}
        >
          <span
            className="absolute top-1 w-4 h-4 rounded-full bg-white transition-all"
            style={{ left: activo ? "calc(100% - 20px)" : "4px" }}
          />
        </button>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="flex-1 h-10 rounded-xl text-sm font-semibold"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)" }}
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          className="flex-1 h-10 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
          style={{ background: "linear-gradient(135deg, #74ACDF 0%, #4a8bc4 100%)" }}
        >
          {submitting ? "Guardando..." : mode === "create" ? "Crear" : "Guardar"}
        </button>
      </div>
    </div>
  );
}

function SponsorsSection({
  sponsors,
  onRefresh,
}: {
  sponsors: Sponsor[];
  onRefresh: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [formMode, setFormMode] = useState<{ type: "none" } | { type: "create" } | { type: "edit"; sponsor: Sponsor }>({ type: "none" });
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function handleToggle(s: Sponsor) {
    startTransition(async () => {
      const result = await toggleSponsorActive(s.id, !s.activo);
      if ("error" in result) {
        toast.error(result.error);
      } else {
        toast.success(s.activo ? "Sponsor desactivado." : "Sponsor activado.");
        onRefresh();
      }
    });
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    const res = await fetch(`/api/admin/sponsors/${id}`, { method: "DELETE" });
    setDeletingId(null);
    if (!res.ok) {
      const json = await res.json().catch(() => ({})) as { error?: string };
      toast.error(json.error ?? "Error al eliminar.");
    } else {
      toast.success("Sponsor eliminado.");
      setConfirmDeleteId(null);
      onRefresh();
    }
  }

  return (
    <div className="mt-8 space-y-3">
      {/* Header */}
      <div
        className="flex items-center gap-2 pb-2"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}
      >
        <h2 className="font-bold text-base text-white flex-1">Sponsors</h2>
        <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.3)", letterSpacing: "1px" }}>
          {sponsors.filter((s) => s.activo).length} activo{sponsors.filter((s) => s.activo).length !== 1 ? "s" : ""}
        </span>
        {formMode.type === "none" && (
          <button
            onClick={() => setFormMode({ type: "create" })}
            className="h-7 px-3 text-xs font-semibold rounded-lg transition-all active:scale-95"
            style={{ background: "rgba(74,172,223,0.15)", border: "1px solid rgba(74,172,223,0.3)", color: "rgba(116,172,223,0.9)" }}
          >
            + Agregar
          </button>
        )}
      </div>

      {/* Create/Edit form */}
      {formMode.type === "create" && (
        <SponsorForm
          mode="create"
          onSuccess={() => { setFormMode({ type: "none" }); onRefresh(); }}
          onCancel={() => setFormMode({ type: "none" })}
        />
      )}
      {formMode.type === "edit" && (
        <SponsorForm
          mode="edit"
          sponsor={formMode.sponsor}
          onSuccess={() => { setFormMode({ type: "none" }); onRefresh(); }}
          onCancel={() => setFormMode({ type: "none" })}
        />
      )}

      {/* List */}
      {sponsors.length === 0 && formMode.type === "none" && (
        <p className="text-sm text-center py-6" style={{ color: "rgba(255,255,255,0.3)" }}>
          Sin sponsors. Usá &quot;+ Agregar&quot; para crear uno.
        </p>
      )}

      {sponsors.map((s) => (
        <div
          key={s.id}
          className="rounded-2xl p-4 space-y-3"
          style={{
            background: s.activo
              ? "linear-gradient(160deg, #0f1322 0%, #07090f 100%)"
              : "linear-gradient(160deg, #0a0e18 0%, #07090f 100%)",
            border: s.activo
              ? "1px solid rgba(74,172,223,0.12)"
              : "1px solid rgba(255,255,255,0.06)",
            opacity: isPending || deletingId === s.id ? 0.6 : 1,
          }}
        >
          {/* Top row */}
          <div className="flex items-start gap-3">
            {/* Logo */}
            <div
              className="w-11 h-11 rounded-xl shrink-0 flex items-center justify-center overflow-hidden"
              style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)" }}
            >
              {s.logo_url ? (
                <img src={s.logo_url} alt={s.nombre} className="w-full h-full object-cover" />
              ) : (
                <span className="text-xs font-bold" style={{ color: "rgba(255,255,255,0.4)" }}>
                  {s.nombre.slice(0, 2).toUpperCase()}
                </span>
              )}
            </div>

            {/* Info */}
            <div className="min-w-0 flex-1">
              <p className="font-bold text-sm text-white">{s.nombre}</p>
              {s.descripcion && (
                <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.45)" }}>{s.descripcion}</p>
              )}
              {s.link_url && (
                <p className="text-xs mt-0.5 truncate" style={{ color: "rgba(116,172,223,0.6)" }}>{s.link_url}</p>
              )}
            </div>

            {/* Toggle */}
            <button
              onClick={() => handleToggle(s)}
              disabled={isPending}
              className="shrink-0 h-7 px-3 text-xs font-semibold rounded-lg transition-all active:scale-95 disabled:opacity-50"
              style={
                s.activo
                  ? { background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.6)" }
                  : { background: "rgba(74,172,223,0.12)", border: "1px solid rgba(74,172,223,0.25)", color: "rgba(116,172,223,0.9)" }
              }
            >
              {s.activo ? "Desactivar" : "Activar"}
            </button>
          </div>

          {/* Bottom row: status + actions */}
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="text-[10px] font-bold"
              style={{ color: s.activo ? "#4ade80" : "rgba(255,255,255,0.25)", letterSpacing: "0.5px" }}
            >
              {s.activo ? "● Activo" : "○ Inactivo"}
            </span>
            <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.2)" }}>· orden {s.orden}</span>

            <div className="ml-auto flex items-center gap-2">
              {confirmDeleteId === s.id ? (
                <>
                  <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.4)" }}>¿Eliminar?</span>
                  <button
                    onClick={() => handleDelete(s.id)}
                    disabled={deletingId === s.id}
                    className="text-[10px] font-bold disabled:opacity-50"
                    style={{ color: "#f87171" }}
                  >
                    {deletingId === s.id ? "..." : "Sí"}
                  </button>
                  <button
                    onClick={() => setConfirmDeleteId(null)}
                    className="text-[10px]"
                    style={{ color: "rgba(255,255,255,0.4)" }}
                  >
                    No
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => { setFormMode({ type: "edit", sponsor: s }); setConfirmDeleteId(null); }}
                    className="text-[10px] font-semibold"
                    style={{ color: "rgba(116,172,223,0.7)" }}
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => setConfirmDeleteId(s.id)}
                    className="text-[10px]"
                    style={{ color: "rgba(248,113,113,0.6)" }}
                  >
                    Eliminar
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function AdminPanel({ matches, sponsors }: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState<MatchWithTeams | null>(null);
  const [homeVal, setHomeVal] = useState("");
  const [awayVal, setAwayVal] = useState("");
  const [isPending, startTransition] = useTransition();

  const dates = Array.from(new Set(matches.map((m) => getMatchDate(m.scheduled_at)))).sort();
  const matchesByDate: Record<string, MatchWithTeams[]> = {};
  for (const d of dates) {
    matchesByDate[d] = matches.filter((m) => getMatchDate(m.scheduled_at) === d);
  }

  function getDefaultIdx(): number {
    if (dates.length === 0) return 0;
    const today = new Date().toISOString().split("T")[0];
    const todayIdx = dates.indexOf(today);
    if (todayIdx !== -1) return todayIdx;
    const futurePending = dates.find(
      (d) =>
        d >= today &&
        (matchesByDate[d] ?? []).some(
          (m) => m.status === "scheduled" || m.status === "live"
        )
    );
    if (futurePending) return dates.indexOf(futurePending);
    return dates.length - 1;
  }

  const [dateIdx, setDateIdx] = useState(() => getDefaultIdx());
  const currentDate = dates[dateIdx] ?? null;
  const currentMatches = currentDate ? (matchesByDate[currentDate] ?? []) : [];

  const today = new Date().toISOString().split("T")[0];
  const pendingToday = (matchesByDate[today] ?? []).filter(
    (m) => m.status === "scheduled" || m.status === "live"
  ).length;

  function openModal(match: MatchWithTeams) {
    setEditing(match);
    setHomeVal(match.home_score !== null ? String(match.home_score) : "");
    setAwayVal(match.away_score !== null ? String(match.away_score) : "");
  }

  function closeModal() {
    setEditing(null);
    setHomeVal("");
    setAwayVal("");
  }

  function handleSubmit() {
    if (!editing) return;
    const h = parseInt(homeVal, 10);
    const a = parseInt(awayVal, 10);
    if (isNaN(h) || isNaN(a) || h < 0 || a < 0) {
      toast.error("Scores inválidos.");
      return;
    }
    startTransition(async () => {
      const result = await submitResult(editing.id, h, a);
      if ("error" in result) {
        toast.error(result.error);
      } else {
        toast.success(
          `Resultado guardado. ${result.predictions_processed} predicción${
            result.predictions_processed !== 1 ? "es" : ""
          } procesada${result.predictions_processed !== 1 ? "s" : ""}.`
        );
        closeModal();
        router.refresh();
      }
    });
  }

  if (dates.length === 0) {
    return (
      <p className="text-sm text-center py-10" style={{ color: "rgba(255,255,255,0.3)" }}>
        Sin partidos disponibles.
      </p>
    );
  }

  return (
    <div className="space-y-4">

      {/* Date navigator */}
      <div className="space-y-2">
        {pendingToday > 0 && (
          <p
            className="text-[11px] font-bold text-center"
            style={{ color: "rgba(251,146,60,0.8)", letterSpacing: "1px" }}
          >
            {pendingToday} partido{pendingToday !== 1 ? "s" : ""} pendiente{pendingToday !== 1 ? "s" : ""} hoy
          </p>
        )}
        <div
          className="flex items-center justify-between rounded-2xl px-3 py-2.5"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.07)",
          }}
        >
          <button
            onClick={() => setDateIdx((i) => Math.max(0, i - 1))}
            disabled={dateIdx === 0}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-lg font-bold transition-all active:scale-95 disabled:opacity-20"
            style={{ color: "white" }}
          >
            ←
          </button>
          <div className="text-center">
            <p className="font-bold text-sm text-white capitalize">
              {currentDate ? formatDateLabel(currentDate) : "—"}
            </p>
            <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.25)" }}>
              {dateIdx + 1} / {dates.length}
            </p>
          </div>
          <button
            onClick={() => setDateIdx((i) => Math.min(dates.length - 1, i + 1))}
            disabled={dateIdx === dates.length - 1}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-lg font-bold transition-all active:scale-95 disabled:opacity-20"
            style={{ color: "white" }}
          >
            →
          </button>
        </div>
      </div>

      {/* Match cards */}
      {currentMatches.length === 0 && (
        <p className="text-sm text-center py-8" style={{ color: "rgba(255,255,255,0.4)" }}>
          Sin partidos este día.
        </p>
      )}

      <div className="space-y-3">
        {currentMatches.map((match) => {
          const isOpen = match.status === "scheduled" || match.status === "live";
          return (
            <div
              key={match.id}
              className="rounded-2xl p-4 space-y-3"
              style={{
                background: isOpen
                  ? "linear-gradient(160deg, #0f1322 0%, #07090f 100%)"
                  : "linear-gradient(160deg, #0a0e18 0%, #07090f 100%)",
                border: isOpen
                  ? "1px solid rgba(251,146,60,0.12)"
                  : "1px solid rgba(255,255,255,0.06)",
              }}
            >
              {/* Teams + score */}
              <div className="flex items-center gap-2">
                {/* Home */}
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <FlagEmoji
                    code={match.home_team.code}
                    flagUrl={match.home_team.flag_url}
                    className="w-9 h-9 rounded-full object-cover shrink-0"
                    alt={match.home_team.name}
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-white">{match.home_team.code}</p>
                    <p className="text-[10px] truncate" style={{ color: "rgba(255,255,255,0.35)" }}>
                      {match.home_team.name}
                    </p>
                  </div>
                </div>

                {/* Score */}
                <div className="text-center shrink-0 px-1">
                  {match.status === "finished" ? (
                    <p className="font-display text-2xl text-white tabular-nums">
                      {match.home_score} — {match.away_score}
                    </p>
                  ) : (
                    <p
                      className="font-display text-xl tabular-nums"
                      style={{ color: "rgba(255,255,255,0.15)" }}
                    >
                      — —
                    </p>
                  )}
                </div>

                {/* Away */}
                <div className="flex items-center gap-2 flex-1 min-w-0 flex-row-reverse">
                  <FlagEmoji
                    code={match.away_team.code}
                    flagUrl={match.away_team.flag_url}
                    className="w-9 h-9 rounded-full object-cover shrink-0"
                    alt={match.away_team.name}
                  />
                  <div className="min-w-0 text-right">
                    <p className="text-sm font-bold text-white">{match.away_team.code}</p>
                    <p className="text-[10px] truncate" style={{ color: "rgba(255,255,255,0.35)" }}>
                      {match.away_team.name}
                    </p>
                  </div>
                </div>
              </div>

              {/* Meta: status + time + phase + action */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap min-w-0">
                  <StatusBadge status={match.status} />
                  <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.25)" }}>
                    <MatchTime scheduledAt={match.scheduled_at} /> · {match.phase}
                  </span>
                </div>

                {match.status !== "cancelled" && (
                  <button
                    onClick={() => openModal(match)}
                    className="shrink-0 h-7 px-3 text-xs font-semibold rounded-lg transition-all active:scale-95"
                    style={
                      isOpen
                        ? {
                            background: "linear-gradient(135deg, #E4002B 0%, #B8001F 100%)",
                            color: "white",
                            boxShadow: "0 2px 8px rgba(228,0,43,0.25)",
                          }
                        : {
                            background: "rgba(255,255,255,0.05)",
                            border: "1px solid rgba(255,255,255,0.1)",
                            color: "rgba(255,255,255,0.45)",
                          }
                    }
                  >
                    {isOpen ? "Cargar resultado" : "Editar"}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Sponsors section */}
      <SponsorsSection sponsors={sponsors} onRefresh={() => router.refresh()} />


      {/* Modal */}
      {editing && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-4"
          style={{ background: "rgba(0,0,0,0.7)" }}
        >
          <div
            className="rounded-2xl p-6 w-full max-w-sm space-y-5"
            style={{
              background: "linear-gradient(160deg, #0d1120 0%, #07090f 100%)",
              border: "1px solid rgba(255,255,255,0.1)",
              boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
            }}
          >
            <div>
              <h2 className="font-bold text-base text-white">Cargar resultado</h2>
              <p className="text-sm mt-0.5" style={{ color: "rgba(255,255,255,0.5)" }}>
                {editing.home_team.name} vs {editing.away_team.name}
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex-1 space-y-1">
                <p className="text-xs text-center" style={{ color: "rgba(255,255,255,0.4)" }}>
                  {editing.home_team.code}
                </p>
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={20}
                  value={homeVal}
                  onChange={(e) => setHomeVal(e.target.value)}
                  disabled={isPending}
                  className="w-full h-14 rounded-xl text-center text-2xl font-bold text-white focus:outline-none disabled:opacity-50 font-display"
                  style={{
                    background: "rgba(255,255,255,0.07)",
                    border: "1px solid rgba(255,255,255,0.12)",
                  }}
                />
              </div>
              <span className="text-xl font-bold" style={{ color: "rgba(255,255,255,0.3)" }}>
                —
              </span>
              <div className="flex-1 space-y-1">
                <p className="text-xs text-center" style={{ color: "rgba(255,255,255,0.4)" }}>
                  {editing.away_team.code}
                </p>
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={20}
                  value={awayVal}
                  onChange={(e) => setAwayVal(e.target.value)}
                  disabled={isPending}
                  className="w-full h-14 rounded-xl text-center text-2xl font-bold text-white focus:outline-none disabled:opacity-50 font-display"
                  style={{
                    background: "rgba(255,255,255,0.07)",
                    border: "1px solid rgba(255,255,255,0.12)",
                  }}
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                className="flex-1 h-11 rounded-xl text-sm font-semibold transition-all active:scale-95 disabled:opacity-50"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "rgba(255,255,255,0.7)",
                }}
                onClick={closeModal}
                disabled={isPending}
              >
                Cancelar
              </button>
              <button
                className="flex-1 h-11 rounded-xl text-sm font-semibold text-white transition-all active:scale-95 disabled:opacity-50"
                style={{
                  background: "linear-gradient(135deg, #E4002B 0%, #B8001F 100%)",
                  boxShadow: "0 4px 16px rgba(228,0,43,0.25)",
                }}
                onClick={handleSubmit}
                disabled={isPending || homeVal === "" || awayVal === ""}
              >
                {isPending ? "Guardando…" : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
