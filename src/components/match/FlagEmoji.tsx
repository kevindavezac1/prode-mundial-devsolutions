"use client";

/**
 * FlagEmoji — client component.
 *
 * Priority:
 *  1. flagUrl (img tag) → on load error falls back to emoji
 *  2. code (FIFA 3-letter or ISO 2-letter) → emoji via regional indicator codepoints
 *  3. fallback → 🏳️
 */

import { useState } from "react";

type Props = {
  code?: string | null;
  flagUrl?: string | null;
  className?: string;
  alt?: string;
};

/**
 * FIFA 3-letter → ISO 3166-1 alpha-2 map.
 * Flag emojis require ISO alpha-2 (regional indicator pairs).
 */
const FIFA_TO_ISO: Record<string, string> = {
  // Americas
  ARG: "AR", BRA: "BR", URU: "UY", COL: "CO", ECU: "EC",
  CHI: "CL", PER: "PE", PAR: "PY", BOL: "BO", VEN: "VE",
  USA: "US", CAN: "CA", MEX: "MX", CRC: "CR", PAN: "PA",
  HON: "HN", NCA: "NI", SLV: "SV", GTM: "GT", BLZ: "BZ",
  JAM: "JM", TRI: "TT", HAI: "HT", DOM: "DO", CUB: "CU",
  // Europe
  FRA: "FR", GER: "DE", ESP: "ES", POR: "PT", NED: "NL",
  BEL: "BE", ITA: "IT", ENG: "GB", WAL: "GB", SCO: "GB",
  NIR: "GB", SUI: "CH", AUT: "AT", DEN: "DK", NOR: "NO",
  SWE: "SE", FIN: "FI", ISL: "IS", LUX: "LU", CRO: "HR",
  SRB: "RS", POL: "PL", CZE: "CZ", SVK: "SK", HUN: "HU",
  ROU: "RO", BUL: "BG", TUR: "TR", GRE: "GR", ALB: "AL",
  MKD: "MK", BIH: "BA", MNE: "ME", SVN: "SI", UKR: "UA",
  RUS: "RU", BLR: "BY", MDA: "MD", GEO: "GE", ARM: "AM",
  AZE: "AZ", LVA: "LV", LTU: "LT", EST: "EE", MON: "MC",
  LIE: "LI", AND: "AD", SMR: "SM", CYP: "CY",
  // Africa
  MAR: "MA", EGY: "EG", ALG: "DZ", TUN: "TN", SEN: "SN",
  GHA: "GH", NGR: "NG", CMR: "CM", CIV: "CI", RSA: "ZA",
  ETH: "ET", KEN: "KE", UGA: "UG", TAN: "TZ", ZAM: "ZM",
  ZIM: "ZW", ANG: "AO", MOZ: "MZ", NAM: "NA", BOT: "BW",
  MLI: "ML", BFA: "BF", NER: "NE", TOG: "TG", BEN: "BJ",
  GIN: "GN", SLE: "SL", LBR: "LR", GAB: "GA", CGO: "CG",
  COD: "CD", CAF: "CF", RWA: "RW", BDI: "BI", ERI: "ER",
  // Asia & Oceania
  KSA: "SA", IRN: "IR", JPN: "JP", KOR: "KR", AUS: "AU",
  NZL: "NZ", CHN: "CN", UAE: "AE", IRQ: "IQ", KWT: "KW",
  QAT: "QA", BHR: "BH", OMA: "OM", JOR: "JO", LIB: "LB",
  SYR: "SY", ISR: "IL", UZB: "UZ", KAZ: "KZ", IND: "IN",
  PAK: "PK", BAN: "BD", IDN: "ID", THA: "TH", VIE: "VN",
  MYS: "MY", PHI: "PH", SGP: "SG",
};

function getIsoCode(code: string): string | null {
  const upper = code.toUpperCase();
  // Already ISO alpha-2
  if (upper.length === 2) return upper;
  // FIFA 3-letter lookup
  return FIFA_TO_ISO[upper] ?? null;
}

function codeToEmoji(isoCode: string): string {
  return isoCode
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

  // Case 2: resolve code → ISO alpha-2 → emoji
  if (code) {
    const iso = getIsoCode(code);
    if (iso) {
      return (
        <span className={className} role="img" aria-label={alt ?? code}>
          {codeToEmoji(iso)}
        </span>
      );
    }
  }

  // Case 3: unknown code — neutral placeholder
  return (
    <span className={className} aria-label="bandera no disponible">
      🏳️
    </span>
  );
}
