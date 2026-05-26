"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateDisplayName } from "@/app/(protected)/profile/actions";

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
        />
        <Button
          type="submit"
          size="sm"
          disabled={isPending || unchanged || !name.trim()}
        >
          {isPending ? "…" : "Guardar"}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">{name.trim().length}/30</p>
    </form>
  );
}
