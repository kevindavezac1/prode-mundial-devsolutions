"use client";

import { useState, useEffect } from "react";

const STORAGE_KEY = "push-permission-asked";

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const output = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) output[i] = rawData.charCodeAt(i);
  return output.buffer;
}

export function PushPermissionBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (
      !("serviceWorker" in navigator) ||
      !("PushManager" in window) ||
      !("Notification" in window) ||
      localStorage.getItem(STORAGE_KEY)
    ) return;

    if (Notification.permission !== "default") {
      localStorage.setItem(STORAGE_KEY, "1");
      return;
    }

    setVisible(true);
  }, []);

  async function handleActivate() {
    localStorage.setItem(STORAGE_KEY, "1");
    setVisible(false);

    const permission = await Notification.requestPermission();
    if (permission !== "granted") return;

    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
      ),
    });

    await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subscription: sub.toJSON() }),
    });
  }

  function handleDismiss() {
    localStorage.setItem(STORAGE_KEY, "1");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      className="mx-4 mt-3 mb-1 rounded-2xl px-4 py-3 flex items-center gap-3"
      style={{
        background: "linear-gradient(135deg, #0d1f3c 0%, #0a1428 100%)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <span className="text-2xl shrink-0">⚽</span>
      <div className="flex-1 min-w-0">
        <p className="text-white text-sm font-semibold leading-tight">
          ¿Querés recibir recordatorios de partidos?
        </p>
        <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.45)" }}>
          Te avisamos cuando un partido está por empezar
        </p>
      </div>
      <div className="flex flex-col gap-1.5 shrink-0">
        <button
          onClick={handleActivate}
          className="text-xs font-bold px-3 py-1.5 rounded-xl transition-all active:scale-95"
          style={{ background: "#e63946", color: "#fff" }}
        >
          Activar
        </button>
        <button
          onClick={handleDismiss}
          className="text-xs px-3 py-1 rounded-xl transition-all active:scale-95"
          style={{ color: "rgba(255,255,255,0.4)" }}
        >
          Ahora no
        </button>
      </div>
    </div>
  );
}
