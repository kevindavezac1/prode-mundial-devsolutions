"use client";

import { useState } from "react";

type Status = "idle" | "loading" | "ok" | "error" | "denied" | "unsupported";

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const output = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) output[i] = rawData.charCodeAt(i);
  return output.buffer;
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout (${ms}ms): ${label}`)), ms)
    ),
  ]);
}

export function PushReactivateButton() {
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState<string>("");

  async function handleReactivate() {
    setErrorMsg("");

    if (
      !("serviceWorker" in navigator) ||
      !("PushManager" in window) ||
      !("Notification" in window)
    ) {
      setStatus("unsupported");
      return;
    }

    setStatus("loading");

    try {
      let permission = Notification.permission;
      if (permission === "default") {
        permission = await withTimeout(
          Notification.requestPermission(),
          15000,
          "requestPermission"
        );
      }

      if (permission !== "granted") {
        setStatus("denied");
        return;
      }

      const reg = await withTimeout(
        navigator.serviceWorker.ready,
        10000,
        "serviceWorker.ready"
      );

      console.log("[push-reactivate] SW ready:", reg.active?.state);

      const sub = await withTimeout(
        reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(
            process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
          ),
        }),
        10000,
        "pushManager.subscribe"
      );

      console.log("[push-reactivate] subscription endpoint:", sub.endpoint);

      const res = await withTimeout(
        fetch("/api/push/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subscription: sub.toJSON() }),
        }),
        10000,
        "fetch /api/push/subscribe"
      );

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(`API ${res.status}: ${body.error ?? "error desconocido"}`);
      }

      console.log("[push-reactivate] saved ok");
      setStatus("ok");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[push-reactivate] error:", msg, err);
      setErrorMsg(msg);
      setStatus("error");
    }
  }

  return (
    <div className="space-y-1">
      <button
        onClick={handleReactivate}
        disabled={status === "loading" || status === "ok" || status === "unsupported"}
        className="w-full text-sm font-semibold px-4 py-2.5 rounded-xl transition-all active:scale-[0.98] disabled:opacity-50"
        style={{
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.1)",
          color:
            status === "ok"
              ? "#4ade80"
              : status === "error" || status === "denied"
              ? "#f87171"
              : "rgba(255,255,255,0.7)",
        }}
      >
        {status === "idle" && "🔔 Reactivar notificaciones"}
        {status === "loading" && "Activando…"}
        {status === "ok" && "✓ Notificaciones activadas"}
        {status === "denied" && "Permiso denegado en el navegador"}
        {status === "unsupported" && "Navegador no soporta notificaciones"}
        {status === "error" && "Error — tocá para reintentar"}
      </button>
      {status === "error" && errorMsg && (
        <p
          className="text-xs px-1 break-all"
          style={{ color: "rgba(248,113,113,0.7)", fontFamily: "monospace" }}
        >
          {errorMsg}
        </p>
      )}
    </div>
  );
}
