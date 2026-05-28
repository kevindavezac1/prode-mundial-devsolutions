"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { updateDisplayName } from "@/app/(app)/profile/actions";

export function EditDisplayName({ currentName }: { currentName: string }) {
  const [name, setName] = useState(currentName);
  const [isPending, startTransition] = useTransition();

  const unchanged = name.trim() === currentName;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await updateDisplayName(name);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Nombre actualizado");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-1.5">
      <div className="flex gap-2">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={30}
          disabled={isPending}
          className="flex-1"
          placeholder="Tu nombre"
          style={{
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.1)",
            color: "white",
          }}
        />
        <button
          type="submit"
          disabled={isPending || unchanged || !name.trim()}
          style={{
            background: "linear-gradient(135deg, #E4002B 0%, #B8001F 100%)",
            color: "white",
            borderRadius: "8px",
            padding: "0 16px",
            height: "40px",
            fontWeight: 700,
            fontSize: "13px",
            opacity: isPending || unchanged || !name.trim() ? 0.5 : 1,
            cursor: isPending || unchanged || !name.trim() ? "not-allowed" : "pointer",
            whiteSpace: "nowrap",
          }}
        >
          {isPending ? "…" : "Guardar"}
        </button>
      </div>
      <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>{name.trim().length}/30</p>
    </form>
  );
}
