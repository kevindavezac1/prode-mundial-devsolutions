"use client";

import { useState } from "react";
import { subscribeAndSave } from "@/components/PushPermissionBanner";

type Status = "idle" | "loading" | "ok" | "error" | "denied" | "unsupported";

export function PushReactivateButton() {
  const [status, setStatus] = useState<Status>("idle");

  async function handleReactivate() {
    if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
      setStatus("unsupported");
      return;
    }

    setStatus("loading");

    let permission = Notification.permission;
    if (permission === "default") {
      permission = await Notification.requestPermission();
    }

    if (permission !== "granted") {
      setStatus("denied");
      return;
    }

    const ok = await subscribeAndSave();
    setStatus(ok ? "ok" : "error");
  }

  const label: Record<Status, string> = {
    idle: "🔔 Reactivar notificaciones",
    loading: "Activando...",
    ok: "✓ Notificaciones activadas",
    error: "Error al activar — intentá de nuevo",
    denied: "Permiso denegado en el navegador",
    unsupported: "Tu navegador no soporta notificaciones",
  };

  return (
    <button
      onClick={handleReactivate}
      disabled={status === "loading" || status === "ok" || status === "unsupported"}
      className="w-full text-sm font-semibold px-4 py-2.5 rounded-xl transition-all active:scale-[0.98] disabled:opacity-50"
      style={{
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.1)",
        color: status === "ok" ? "#4ade80" : status === "error" || status === "denied" ? "#f87171" : "rgba(255,255,255,0.7)",
      }}
    >
      {label[status]}
    </button>
  );
}
