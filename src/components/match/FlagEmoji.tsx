"use client";

/**
 * FlagEmoji — client component.
 *
 * Priority:
 *  1. flagUrl (img tag) → on load error falls back to emoji
 *  2. code (ISO 3166-1 alpha-2, e.g. "AR") → emoji via regional indicator codepoints
 *  3. fallback → 🏳️
 *
 * Caller controls size via className (e.g. "text-2xl", "text-3xl", "w-8 h-8").
 */

import { useState } from "react";

type Props = {
  code?: string | null;      // ISO alpha-2, e.g. "AR", "BR", "MX"
  flagUrl?: string | null;   // from teams.flag_url — preferred when available
  className?: string;
  alt?: string;
};

function codeToEmoji(code: string): string {
  return code
    .toUpperCase()
    .replace(/./g, (char) =>
      String.fromCodePoint(127397 + char.charCodeAt(0))
    );
}

export function FlagEmoji({ code, flagUrl, className, alt }: Props) {
  const [imgError, setImgError] = useState(false);

  // Case 1: image URL available and not yet errored
  if (flagUrl && !imgError) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={flagUrl}
        alt={alt ?? code ?? "flag"}
        className={className}
        onError={() => setImgError(true)}
      />
    );
  }

  // Case 2: no image (or image failed) — try emoji from ISO code
  if (code && code.length === 2) {
    return (
      <span className={className} role="img" aria-label={alt ?? code}>
        {codeToEmoji(code)}
      </span>
    );
  }

  // Case 3: no code either — neutral placeholder
  return (
    <span className={className} aria-label="bandera no disponible">
      🏳️
    </span>
  );
}
