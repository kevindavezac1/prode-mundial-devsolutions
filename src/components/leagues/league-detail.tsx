"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import type { LeagueDetail, LeagueMember } from "@/types/leagues";
import { LeagueAvatar } from "@/components/leagues/league-avatar";
import { updateLeagueImageUrl } from "@/app/(app)/leagues/[id]/actions";

type Props = { league: LeagueDetail; userId: string };

// ─── Confirm modal ─────────────────────────────────────────────────────────────

type ModalState = {
  title: string;
  description: string;
  confirmLabel: string;
  danger?: boolean;
  onConfirm: () => Promise<void>;
} | null;

function ConfirmModal({
  modal,
  onClose,
}: {
  modal: NonNullable<ModalState>;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(false);

  async function handleConfirm() {
    setLoading(true);
    try {
      await modal.onConfirm();
    } finally {
      setLoading(false);
      onClose();
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl p-5 space-y-4"
        style={{
          background: "linear-gradient(160deg, #0d1120 0%, #07090f 100%)",
          border: "1px solid rgba(255,255,255,0.1)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div>
          <p className="font-bold text-white text-base">{modal.title}</p>
          <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.5)" }}>
            {modal.description}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 h-11 rounded-xl text-sm font-semibold"
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "rgba(255,255,255,0.7)",
            }}
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="flex-1 h-11 rounded-xl text-sm font-bold"
            style={{
              background: modal.danger
                ? "linear-gradient(135deg, #E4002B 0%, #B8001F 100%)"
                : "rgba(255,255,255,0.1)",
              color: "white",
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? "…" : modal.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main view ─────────────────────────────────────────────────────────────────

export function LeagueDetailView({ league, userId }: Props) {
  const [copiedPermanent, setCopiedPermanent] = useState(false);
  const [modal, setModal] = useState<ModalState>(null);
  const [members, setMembers] = useState<LeagueMember[]>(league.members);

  const isOwner = league.owner_id === userId;
  const [allowMemberInvite, setAllowMemberInvite] = useState(league.allow_member_invite ?? false);

  // ── League avatar upload ──────────────────────────────────────────────────
  const fileRef = useRef<HTMLInputElement>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(league.image_url ?? null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [imageSaving, setImageSaving] = useState(false);

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setImageError(null);
    if (!["image/jpeg", "image/png", "image/webp"].includes(selected.type)) {
      setImageError("Formato no válido. Usá JPG, PNG o WebP.");
      return;
    }
    if (selected.size > 5 * 1024 * 1024) {
      setImageError("Máximo 5MB.");
      return;
    }
    setImageFile(selected);
    setImagePreview(URL.createObjectURL(selected));
  }

  async function handleImageSave() {
    if (!imageFile) return;
    setImageSaving(true);
    setImageError(null);
    const supabase = createClient();
    const ext = imageFile.type.split("/")[1];
    const path = `${league.id}/logo.${ext}`;

    const { error: storageError } = await supabase.storage
      .from("league-images")
      .upload(path, imageFile, { upsert: true, contentType: imageFile.type });

    if (storageError) {
      setImageError("Error al subir. Intentá de nuevo.");
      setImageSaving(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from("league-images")
      .getPublicUrl(path);

    const urlWithBust = `${publicUrl}?t=${Date.now()}`;
    const result = await updateLeagueImageUrl(league.id, urlWithBust);

    if (result.error) {
      setImageError(result.error);
      setImageSaving(false);
      return;
    }

    setImageUrl(urlWithBust);
    setImagePreview(null);
    setImageFile(null);
    if (fileRef.current) fileRef.current.value = "";
    setImageSaving(false);
    toast.success("Foto de liga actualizada.");
  }

  function handleImageCancel() {
    setImageFile(null);
    setImagePreview(null);
    setImageError(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  // ── Edit league name ──────────────────────────────────────────────────────
  const [leagueName, setLeagueName] = useState(league.name);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(league.name);
  const [savingName, setSavingName] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);

  async function saveName() {
    const trimmed = nameInput.trim();
    if (trimmed.length < 3 || trimmed.length > 50) {
      setNameError("Entre 3 y 50 caracteres.");
      return;
    }
    setSavingName(true);
    setNameError(null);
    const res = await fetch(`/api/leagues/${league.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: trimmed }),
    });
    setSavingName(false);
    if (!res.ok) {
      const body = await res.json();
      setNameError(body.error ?? "Error al guardar.");
      return;
    }
    setLeagueName(trimmed);
    setEditingName(false);
    toast.success("Nombre actualizado.");
  }

  function cancelEditName() {
    setEditingName(false);
    setNameInput(leagueName);
    setNameError(null);
  }

  function getPermanentLink() {
    return `${window.location.origin}/join/liga/${league.id}`;
  }

  async function copyPermanentLink() {
    try {
      await navigator.clipboard.writeText(getPermanentLink());
      setCopiedPermanent(true);
      toast.success("Link permanente copiado");
      setTimeout(() => setCopiedPermanent(false), 2000);
    } catch {
      toast.error("No se pudo copiar");
    }
  }

  // ── Toggle member invite ──────────────────────────────────────────────────

  async function toggleMemberInvite() {
    const next = !allowMemberInvite;
    setAllowMemberInvite(next);
    const res = await fetch(`/api/leagues/${league.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ allow_member_invite: next }),
    });
    if (!res.ok) {
      setAllowMemberInvite(!next);
      toast.error("Error al actualizar el permiso.");
    }
  }

  // ── Leave league ──────────────────────────────────────────────────────────

  function confirmLeave() {
    setModal({
      title: "¿Salir de la liga?",
      description: `Saldrás de "${league.name}". Podrás volver a unirte en el futuro si tenés el link de invitación.`,
      confirmLabel: "Salir de la liga",
      danger: true,
      onConfirm: async () => {
        const res = await fetch(`/api/leagues/${league.id}/leave`, { method: "DELETE" });
        const body = await res.json();
        if (!res.ok) {
          toast.error(body.error ?? "Error al salir de la liga.");
          return;
        }
        toast.success("Saliste de la liga.");
        window.location.href = "/leagues";
      },
    });
  }

  // ── Delete league ─────────────────────────────────────────────────────────

  function confirmDeleteLeague() {
    setModal({
      title: `¿Eliminar "${league.name}"?`,
      description: "Esta acción eliminará la liga y todos sus datos. No se puede deshacer.",
      confirmLabel: "Eliminar liga",
      danger: true,
      onConfirm: async () => {
        const res = await fetch(`/api/leagues/${league.id}`, { method: "DELETE" });
        const body = await res.json();
        if (!res.ok) {
          toast.error(body.error ?? "Error al eliminar la liga.");
          return;
        }
        toast.success("Liga eliminada.");
        window.location.href = "/leagues";
      },
    });
  }

  // ── Kick member ───────────────────────────────────────────────────────────

  function confirmKick(member: LeagueMember) {
    setModal({
      title: `¿Expulsar a ${member.display_name}?`,
      description: "Esta acción es permanente — el usuario quedará bloqueado y no podrá volver a unirse a esta liga bajo ningún concepto.",
      confirmLabel: "Expulsar permanentemente",
      danger: true,
      onConfirm: async () => {
        const res = await fetch(`/api/leagues/${league.id}/members/${member.user_id}`, {
          method: "DELETE",
        });
        const body = await res.json();
        if (!res.ok) {
          toast.error(body.error ?? "Error al expulsar al miembro.");
          return;
        }
        toast.success(`${member.display_name} fue expulsado.`);
        setMembers((prev) => prev.filter((m) => m.user_id !== member.user_id));
      },
    });
  }

  return (
    <>
      {modal && <ConfirmModal modal={modal} onClose={() => setModal(null)} />}

      <div className="space-y-5">

        {/* League avatar */}
        <div className="flex flex-col items-center gap-2">
          {isOwner ? (
            <div
              className="relative group cursor-pointer"
              onClick={() => !imageSaving && fileRef.current?.click()}
            >
              <LeagueAvatar imageUrl={imagePreview ?? imageUrl} name={leagueName} size="lg" />
              <div
                className="absolute inset-0 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                style={{ background: "rgba(0,0,0,0.55)" }}
              >
                <span className="text-base">📷</span>
              </div>
            </div>
          ) : (
            <LeagueAvatar imageUrl={imageUrl} name={leagueName} size="lg" />
          )}

          {isOwner && (
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleImageChange}
            />
          )}

          {imageFile ? (
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={handleImageSave}
                disabled={imageSaving}
                className="h-6 px-2.5 text-[10px] font-bold rounded-lg transition-all active:scale-95 disabled:opacity-60"
                style={{ background: "linear-gradient(135deg, #E4002B 0%, #B8001F 100%)", color: "white" }}
              >
                {imageSaving ? "Subiendo…" : "Guardar"}
              </button>
              <button
                type="button"
                onClick={handleImageCancel}
                disabled={imageSaving}
                className="h-6 px-2.5 text-[10px] font-semibold rounded-lg disabled:opacity-60"
                style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.55)" }}
              >
                ✕
              </button>
            </div>
          ) : isOwner ? (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="text-[10px] font-semibold"
              style={{ color: "rgba(255,255,255,0.25)" }}
            >
              Cambiar foto
            </button>
          ) : null}

          {imageError && (
            <p className="text-[10px] text-center" style={{ color: "#f87171" }}>{imageError}</p>
          )}
        </div>

        {/* League name — editable for owner */}
        {isOwner && (
          <div
            className="rounded-2xl px-4 py-3 space-y-2"
            style={{
              background: "linear-gradient(160deg, #0d1120 0%, #07090f 100%)",
              border: "1px solid rgba(255,255,255,0.07)",
            }}
          >
            <p
              className="text-[10px] font-bold"
              style={{ color: "rgba(255,255,255,0.35)", letterSpacing: "2px" }}
            >
              NOMBRE DE LA LIGA
            </p>
            {editingName ? (
              <div className="space-y-2">
                <input
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  maxLength={50}
                  disabled={savingName}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveName();
                    if (e.key === "Escape") cancelEditName();
                  }}
                  className="w-full px-3 py-2 rounded-xl text-base font-bold text-white focus:outline-none disabled:opacity-50"
                  style={{
                    background: "rgba(255,255,255,0.07)",
                    border: "1px solid rgba(255,255,255,0.18)",
                  }}
                />
                <div className="flex gap-2">
                  <button
                    onClick={saveName}
                    disabled={savingName}
                    className="flex-1 py-2 rounded-xl text-xs font-bold text-white transition-all active:scale-95 disabled:opacity-50"
                    style={{ background: "linear-gradient(135deg, #E4002B 0%, #B8001F 100%)" }}
                  >
                    {savingName ? "…" : "Guardar"}
                  </button>
                  <button
                    onClick={cancelEditName}
                    disabled={savingName}
                    className="flex-1 py-2 rounded-xl text-xs font-semibold disabled:opacity-50"
                    style={{ background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.6)" }}
                  >
                    Cancelar
                  </button>
                </div>
                {nameError && (
                  <p className="text-xs" style={{ color: "#f87171" }}>{nameError}</p>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-white flex-1 truncate">{leagueName}</span>
                <button
                  onClick={() => { setEditingName(true); setNameInput(leagueName); }}
                  className="text-base shrink-0 transition-opacity"
                  style={{ opacity: 0.45 }}
                  title="Editar nombre"
                >
                  ✏️
                </button>
              </div>
            )}
          </div>
        )}

        {/* Permanent link — owner always, members if allowed */}
        {(isOwner || allowMemberInvite) && (
          <div
            className="rounded-2xl px-4 py-4 space-y-3"
            style={{
              background: "linear-gradient(160deg, #0d1120 0%, #07090f 100%)",
              border: "1px solid rgba(255,255,255,0.07)",
            }}
          >
            <p
              className="text-[10px] font-bold"
              style={{ color: "rgba(255,255,255,0.35)", letterSpacing: "2px" }}
            >
              LINK PERMANENTE
            </p>
            <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>
              Esta URL nunca cambia. Expulsados no pueden entrar.
            </p>
            <button
              onClick={copyPermanentLink}
              className="w-full py-2.5 rounded-xl text-[11px] font-bold transition-all active:scale-95"
              style={
                copiedPermanent
                  ? {
                      background: "rgba(10,110,62,0.2)",
                      border: "1px solid rgba(10,110,62,0.4)",
                      color: "#4ade80",
                      letterSpacing: "1px",
                    }
                  : {
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      color: "rgba(255,255,255,0.6)",
                      letterSpacing: "1px",
                    }
              }
            >
              {copiedPermanent
                ? "✓ COPIADO"
                : typeof window !== "undefined"
                ? `COPIAR — ${window.location.origin}/join/liga/${league.id}`
                : "COPIAR LINK PERMANENTE"}
            </button>
          </div>
        )}

        {/* Toggle member invite — owner only */}
        {isOwner && (
          <div
            className="rounded-2xl px-4 py-3"
            style={{
              background: "linear-gradient(160deg, #0d1120 0%, #07090f 100%)",
              border: "1px solid rgba(255,255,255,0.07)",
            }}
          >
            <button
              onClick={toggleMemberInvite}
              className="w-full flex items-center justify-between gap-3"
            >
              <span className="text-sm text-white font-medium text-left">
                Permitir que los miembros compartan el link
              </span>
              <div
                className="relative shrink-0 w-10 h-6 rounded-full transition-colors"
                style={{
                  background: allowMemberInvite ? "rgba(228,0,43,0.7)" : "rgba(255,255,255,0.12)",
                  border: allowMemberInvite ? "1px solid rgba(228,0,43,0.4)" : "1px solid rgba(255,255,255,0.1)",
                }}
              >
                <div
                  className="absolute top-0.5 w-5 h-5 rounded-full transition-transform"
                  style={{
                    background: "white",
                    transform: allowMemberInvite ? "translateX(1.25rem)" : "translateX(0.125rem)",
                  }}
                />
              </div>
            </button>
          </div>
        )}

        {/* Leaderboard */}
        <div className="space-y-2">
          <p
            className="text-[10px] font-bold px-1"
            style={{ color: "rgba(255,255,255,0.35)", letterSpacing: "2px" }}
          >
            TABLA DE POSICIONES
          </p>

          <div
            className="rounded-2xl overflow-hidden"
            style={{ border: "1px solid rgba(255,255,255,0.07)" }}
          >
            {/* Header row */}
            <div
              className="grid gap-2 px-4 py-2"
              style={{
                gridTemplateColumns: isOwner ? "2rem 1fr 4rem 4rem" : "2rem 1fr 4rem",
                background: "rgba(255,255,255,0.03)",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <span className="text-[10px] font-bold text-center" style={{ color: "rgba(255,255,255,0.25)", letterSpacing: "1px" }}>#</span>
              <span className="text-[10px] font-bold" style={{ color: "rgba(255,255,255,0.25)", letterSpacing: "1px" }}>JUGADOR</span>
              <span className="text-[10px] font-bold text-right" style={{ color: "rgba(255,255,255,0.25)", letterSpacing: "1px" }}>PTS</span>
              {isOwner && <span />}
            </div>

            {members.length === 0 ? (
              <p className="text-sm text-center py-8" style={{ color: "rgba(255,255,255,0.3)" }}>
                Sin miembros.
              </p>
            ) : (
              members.map((member, idx) => (
                <MemberRow
                  key={member.user_id}
                  member={member}
                  position={idx + 1}
                  isMe={member.user_id === userId}
                  isOwner={isOwner}
                  leagueId={league.id}
                  onKick={() => confirmKick(member)}
                />
              ))
            )}
          </div>
        </div>

        {/* Danger zone */}
        <div className="space-y-2 pt-2">
          {!isOwner && (
            <button
              onClick={confirmLeave}
              className="w-full h-11 rounded-xl text-sm font-semibold transition-all active:scale-[0.98]"
              style={{
                background: "rgba(228,0,43,0.08)",
                border: "1px solid rgba(228,0,43,0.2)",
                color: "rgba(228,0,43,0.8)",
              }}
            >
              Salir de la liga
            </button>
          )}

          {isOwner && (
            <button
              onClick={confirmDeleteLeague}
              className="w-full h-11 rounded-xl text-sm font-semibold transition-all active:scale-[0.98]"
              style={{
                background: "rgba(228,0,43,0.08)",
                border: "1px solid rgba(228,0,43,0.2)",
                color: "rgba(228,0,43,0.8)",
              }}
            >
              Eliminar liga
            </button>
          )}
        </div>

      </div>
    </>
  );
}

// ─── Member row ────────────────────────────────────────────────────────────────

function MemberRow({
  member,
  position,
  isMe,
  isOwner,
  leagueId,
  onKick,
}: {
  member: LeagueMember;
  position: number;
  isMe: boolean;
  isOwner: boolean;
  leagueId: string;
  onKick: () => void;
}) {
  const medal =
    position === 1 ? "🥇" : position === 2 ? "🥈" : position === 3 ? "🥉" : null;

  const rowContent = (
    <>
      <span className="text-sm text-center font-bold" style={{ color: "rgba(255,255,255,0.4)" }}>
        {medal ?? position}
      </span>

      <div className="flex items-center gap-2.5 min-w-0">
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 overflow-hidden"
          style={{ background: isMe ? "rgba(228,0,43,0.3)" : "rgba(255,255,255,0.08)" }}
        >
          {member.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={member.avatar_url} alt={member.display_name} className="w-full h-full object-cover" />
          ) : (
            member.display_name[0]?.toUpperCase() ?? "?"
          )}
        </div>
        <span className="text-sm text-white truncate font-medium">
          {member.display_name}
          {isMe && (
            <span
              className="ml-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded"
              style={{ background: "rgba(228,0,43,0.22)", color: "rgba(228,0,43,0.95)", letterSpacing: "0.5px" }}
            >
              VOS
            </span>
          )}
        </span>
      </div>

      <div className="text-right">
        <span
          className="font-display text-base text-white tabular-nums"
          style={position <= 3 ? { color: "#D4AF37" } : {}}
        >
          {member.total_points}
        </span>
        <span className="text-[10px] ml-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>pts</span>
      </div>

      {isOwner && (
        <div className="flex justify-end">
          {!isMe && (
            <button
              onClick={(e) => { e.preventDefault(); onKick(); }}
              className="text-[10px] font-bold rounded-lg px-2 py-1 transition-all active:scale-95"
              style={{
                background: "rgba(228,0,43,0.1)",
                border: "1px solid rgba(228,0,43,0.2)",
                color: "rgba(228,0,43,0.7)",
                letterSpacing: "0.5px",
              }}
            >
              EXPULSAR
            </button>
          )}
        </div>
      )}
    </>
  );

  const gridStyle: React.CSSProperties = {
    gridTemplateColumns: isOwner ? "2rem 1fr 4rem 4rem" : "2rem 1fr 4rem",
    borderBottom: "1px solid rgba(255,255,255,0.04)",
    background: isMe ? "rgba(228,0,43,0.13)" : "transparent",
    borderLeft: isMe ? "3px solid rgba(228,0,43,0.55)" : "3px solid transparent",
  };

  if (member.username) {
    return (
      <Link
        href={`/profile/${member.username}?from=/leagues/${leagueId}`}
        className="grid gap-2 px-4 py-3 items-center transition-colors hover:bg-white/[0.03]"
        style={gridStyle}
      >
        {rowContent}
      </Link>
    );
  }

  return (
    <div className="grid gap-2 px-4 py-3 items-center" style={gridStyle}>
      {rowContent}
    </div>
  );
}
