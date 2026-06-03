"use client";

import { useState } from "react";

type Props = {
  code?: string | null;
  flagUrl?: string | null;
  className?: string;
  alt?: string;
};

// Maps FIFA 3-letter codes to flagcdn.com path codes.
// Most countries use ISO alpha-2 lowercase. UK home nations use gb-xxx subdivision codes.
const FIFA_TO_FLAGCDN: Record<string, string> = {
  // Americas
  ARG: "ar", BRA: "br", URU: "uy", COL: "co", ECU: "ec",
  CHI: "cl", PER: "pe", PAR: "py", BOL: "bo", VEN: "ve",
  USA: "us", CAN: "ca", MEX: "mx", CRC: "cr", PAN: "pa",
  HON: "hn", NCA: "ni", SLV: "sv", GTM: "gt", BLZ: "bz",
  JAM: "jm", TRI: "tt", HAI: "ht", DOM: "do", CUB: "cu", CUW: "cw",
  // Europe
  FRA: "fr", GER: "de", ESP: "es", POR: "pt", NED: "nl",
  BEL: "be", ITA: "it",
  ENG: "gb-eng", WAL: "gb-wls", SCO: "gb-sct", NIR: "gb-nir",
  SUI: "ch", AUT: "at", DEN: "dk", NOR: "no",
  SWE: "se", FIN: "fi", ISL: "is", LUX: "lu", CRO: "hr",
  SRB: "rs", POL: "pl", CZE: "cz", SVK: "sk", HUN: "hu",
  ROU: "ro", BUL: "bg", TUR: "tr", GRE: "gr", ALB: "al",
  MKD: "mk", BIH: "ba", MNE: "me", SVN: "si", UKR: "ua",
  RUS: "ru", BLR: "by", MDA: "md", GEO: "ge", ARM: "am",
  AZE: "az", LVA: "lv", LTU: "lt", EST: "ee", MON: "mc",
  LIE: "li", AND: "ad", SMR: "sm", CYP: "cy",
  // Africa
  MAR: "ma", EGY: "eg", ALG: "dz", TUN: "tn", SEN: "sn", CPV: "cv",
  GHA: "gh", NGR: "ng", CMR: "cm", CIV: "ci", RSA: "za",
  ETH: "et", KEN: "ke", UGA: "ug", TAN: "tz", ZAM: "zm",
  ZIM: "zw", ANG: "ao", MOZ: "mz", NAM: "na", BOT: "bw",
  MLI: "ml", BFA: "bf", NER: "ne", TOG: "tg", BEN: "bj",
  GIN: "gn", SLE: "sl", LBR: "lr", GAB: "ga", CGO: "cg",
  COD: "cd", CAF: "cf", RWA: "rw", BDI: "bi", ERI: "er",
  // Asia & Oceania
  KSA: "sa", IRN: "ir", JPN: "jp", KOR: "kr", AUS: "au",
  NZL: "nz", CHN: "cn", UAE: "ae", IRQ: "iq", KWT: "kw",
  QAT: "qa", BHR: "bh", OMA: "om", JOR: "jo", LIB: "lb",
  SYR: "sy", ISR: "il", UZB: "uz", KAZ: "kz", IND: "in",
  PAK: "pk", BAN: "bd", IDN: "id", THA: "th", VIE: "vn",
  MYS: "my", PHI: "ph", SGP: "sg",
};

function getFlagCdnCode(code: string): string | null {
  const upper = code.toUpperCase();
  if (FIFA_TO_FLAGCDN[upper]) return FIFA_TO_FLAGCDN[upper];
  // Already ISO alpha-2 → lowercase works directly on flagcdn
  if (upper.length === 2) return upper.toLowerCase();
  return null;
}

export function FlagEmoji({ code, flagUrl, className, alt }: Props) {
  const [flagUrlError, setFlagUrlError] = useState(false);
  const [flagCdnError, setFlagCdnError] = useState(false);

  const flagCdnCode = code ? getFlagCdnCode(code) : null;
  const flagCdnUrl = flagCdnCode
    ? `https://flagcdn.com/w80/${flagCdnCode}.png`
    : null;

  // Priority 1: DB flag URL
  if (flagUrl && !flagUrlError) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={flagUrl}
        alt={alt ?? code ?? "flag"}
        className={className}
        style={{ objectFit: "cover", objectPosition: "center" }}
        onError={() => setFlagUrlError(true)}
      />
    );
  }

  // Priority 2: flagcdn.com (works on Windows/Chrome, supports gb-xxx subdivisions)
  if (flagCdnUrl && !flagCdnError) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={flagCdnUrl}
        alt={alt ?? code ?? "flag"}
        className={className}
        style={{ objectFit: "cover", objectPosition: "center" }}
        onError={() => setFlagCdnError(true)}
      />
    );
  }

  return (
    <span className={className} aria-label="bandera no disponible">
      🏳️
    </span>
  );
}
