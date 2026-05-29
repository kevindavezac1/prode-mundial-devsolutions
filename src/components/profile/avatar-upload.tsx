"use client";

import { useRef, useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { updateAvatarUrl } from "@/app/(app)/profile/actions";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 5 * 1024 * 1024;

type Props = {
  userId: string;
  displayName: string;
  currentAvatarUrl: string | null;
};

export function AvatarUpload({ userId, displayName, currentAvatarUrl }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [currentUrl, setCurrentUrl] = useState<string | null>(currentAvatarUrl);
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setUploadError(null);

    if (!ALLOWED_TYPES.includes(selected.type)) {
      setUploadError("Formato no válido. Usá JPG, PNG o WebP.");
      return;
    }
    if (selected.size > MAX_SIZE) {
      setUploadError("La imagen no puede superar los 5MB.");
      return;
    }

    setFile(selected);
    setPreview(URL.createObjectURL(selected));
  }

  function handleCancel() {
    setFile(null);
    setPreview(null);
    setUploadError(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  function handleSave() {
    if (!file) return;
    startTransition(async () => {
      setUploadError(null);
      const supabase = createClient();
      const path = `${userId}/avatar`;

      const { error: storageError } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true, contentType: file.type });

      if (storageError) {
        setUploadError("Error al subir la imagen. Intentá de nuevo.");
        return;
      }

      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(path);

      const urlWithBust = `${publicUrl}?t=${Date.now()}`;
      const result = await updateAvatarUrl(urlWithBust);

      if (result.error) {
        setUploadError(result.error);
        return;
      }

      setCurrentUrl(urlWithBust);
      setFile(null);
      setPreview(null);
      if (fileRef.current) fileRef.current.value = "";
    });
  }

  const displaySrc = preview ?? currentUrl;

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Avatar circle */}
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        className="relative w-16 h-16 rounded-full overflow-hidden flex items-center justify-center text-2xl font-bold text-white group shrink-0"
        style={{
          background: "rgba(255,255,255,0.07)",
          border: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        {displaySrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={displaySrc} alt="avatar" className="w-full h-full object-cover" />
        ) : (
          displayName[0]?.toUpperCase() ?? "?"
        )}
        <div
          className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ background: "rgba(0,0,0,0.55)" }}
        >
          <span className="text-base">📷</span>
        </div>
      </button>

      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Actions */}
      {file ? (
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={handleSave}
            disabled={isPending}
            className="h-6 px-2.5 text-[10px] font-bold rounded-lg transition-all active:scale-95 disabled:opacity-60"
            style={{
              background: "linear-gradient(135deg, #E4002B 0%, #B8001F 100%)",
              color: "white",
            }}
          >
            {isPending ? "Subiendo…" : "Guardar"}
          </button>
          <button
            type="button"
            onClick={handleCancel}
            disabled={isPending}
            className="h-6 px-2.5 text-[10px] font-semibold rounded-lg disabled:opacity-60"
            style={{
              background: "rgba(255,255,255,0.07)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "rgba(255,255,255,0.55)",
            }}
          >
            ✕
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="text-[10px] font-semibold"
          style={{ color: "rgba(255,255,255,0.25)" }}
        >
          Cambiar foto
        </button>
      )}

      {uploadError && (
        <p className="text-[10px] text-center" style={{ color: "#f87171", maxWidth: "80px" }}>
          {uploadError}
        </p>
      )}
    </div>
  );
}
