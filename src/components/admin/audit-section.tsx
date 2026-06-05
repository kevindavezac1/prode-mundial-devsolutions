"use client";

import { useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type TeamRef = { code: string };

type MatchRef = {
  id: number;
  scheduled_at: string;
  home_team: TeamRef | null;
  away_team: TeamRef | null;
};

type ResultAuditRow = {
  id: number;
  match_id: number;
  changed_by: string | null;
  source: string;
  previous_home: number | null;
  previous_away: number | null;
  new_home: number;
  new_away: number;
  changed_at: string;
  matches: MatchRef | null;
};

type PredictionAuditRow = {
  id: number;
  prediction_id: number;
  match_id: number;
  user_id: string;
  old_home: number | null;
  old_away: number | null;
  new_home: number;
  new_away: number;
  changed_at: string;
  matches: MatchRef | null;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(ts: string) {
  return new Date(ts).toLocaleString("es-AR", {
    timeZone: "America/Argentina/Buenos_Aires",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function isSuspicious(row: PredictionAuditRow): boolean {
  if (!row.matches?.scheduled_at) return false;
  const cutoff = new Date(row.matches.scheduled_at).getTime() - 5 * 60 * 1000;
  return new Date(row.changed_at).getTime() >= cutoff;
}

// ─── Panel A — Result audit log ───────────────────────────────────────────────

function ResultAuditPanel() {
  const [rows, setRows] = useState<ResultAuditRow[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState("");

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/audit/results");
      const json = await res.json() as { data?: ResultAuditRow[]; error?: string };
      if (!res.ok) { setError(json.error ?? "Error."); return; }
      setRows(json.data ?? []);
    } catch {
      setError("Error de red.");
    } finally {
      setLoading(false);
    }
  }

  const filtered = rows?.filter((r) => {
    if (!filter) return true;
    const q = filter.toLowerCase();
    const homeCode = r.matches?.home_team?.code?.toLowerCase() ?? "";
    const awayCode = r.matches?.away_team?.code?.toLowerCase() ?? "";
    return homeCode.includes(q) || awayCode.includes(q) || String(r.match_id).includes(q);
  }) ?? [];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <h3 className="font-semibold text-sm text-white flex-1">Audit de resultados</h3>
        <button
          onClick={load}
          disabled={loading}
          className="h-7 px-3 text-xs font-semibold rounded-lg transition-all active:scale-95 disabled:opacity-50"
          style={{ background: "rgba(74,172,223,0.15)", border: "1px solid rgba(74,172,223,0.3)", color: "rgba(116,172,223,0.9)" }}
        >
          {loading ? "Cargando…" : rows === null ? "Cargar" : "Recargar"}
        </button>
      </div>

      {error && (
        <p className="text-xs" style={{ color: "#f87171" }}>{error}</p>
      )}

      {rows !== null && (
        <input
          type="text"
          placeholder="Filtrar por equipo o match_id…"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-full h-9 rounded-xl px-3 text-sm text-white focus:outline-none"
          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
        />
      )}

      {rows !== null && filtered.length === 0 && (
        <p className="text-xs text-center py-4" style={{ color: "rgba(255,255,255,0.3)" }}>
          Sin registros.
        </p>
      )}

      {filtered.map((r) => (
        <div
          key={r.id}
          className="rounded-xl px-3 py-2.5 text-xs space-y-1"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
        >
          <div className="flex items-center gap-2">
            <span className="font-bold text-white">
              {r.matches?.home_team?.code ?? "?"} vs {r.matches?.away_team?.code ?? "?"} (#{r.match_id})
            </span>
            <span className="ml-auto" style={{ color: "rgba(255,255,255,0.3)" }}>
              {fmt(r.changed_at)}
            </span>
          </div>
          <div className="flex items-center gap-3" style={{ color: "rgba(255,255,255,0.55)" }}>
            <span>
              Antes:{" "}
              <span className="font-mono">
                {r.previous_home ?? "—"} – {r.previous_away ?? "—"}
              </span>
            </span>
            <span style={{ color: "rgba(255,255,255,0.2)" }}>→</span>
            <span>
              Nuevo:{" "}
              <span className="font-mono font-semibold text-white">
                {r.new_home} – {r.new_away}
              </span>
            </span>
            <span className="ml-auto" style={{ color: "rgba(255,255,255,0.3)" }}>
              {r.source}
            </span>
          </div>
          {r.changed_by && (
            <p className="font-mono" style={{ color: "rgba(255,255,255,0.25)", fontSize: "10px" }}>
              por {r.changed_by}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Panel B — User verifier ──────────────────────────────────────────────────

function UserVerifierPanel() {
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState<PredictionAuditRow[] | null>(null);
  const [resolvedId, setResolvedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function verify() {
    const q = query.trim();
    if (!q) return;
    setLoading(true);
    setError(null);
    setRows(null);
    setResolvedId(null);
    try {
      const res = await fetch(`/api/admin/audit/user?q=${encodeURIComponent(q)}`);
      const json = await res.json() as { data?: PredictionAuditRow[]; userId?: string; error?: string };
      if (!res.ok) { setError(json.error ?? "Error."); return; }
      setRows(json.data ?? []);
      setResolvedId(json.userId ?? null);
    } catch {
      setError("Error de red.");
    } finally {
      setLoading(false);
    }
  }

  const suspicious = rows?.filter(isSuspicious) ?? [];
  const isClean = rows !== null && suspicious.length === 0;

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-sm text-white">Verificador del ganador</h3>

      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Username o user_id…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && verify()}
          className="flex-1 h-9 rounded-xl px-3 text-sm text-white focus:outline-none"
          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
        />
        <button
          onClick={verify}
          disabled={loading || !query.trim()}
          className="h-9 px-4 text-xs font-semibold rounded-xl transition-all active:scale-95 disabled:opacity-50"
          style={{ background: "rgba(74,172,223,0.15)", border: "1px solid rgba(74,172,223,0.3)", color: "rgba(116,172,223,0.9)" }}
        >
          {loading ? "…" : "Verificar"}
        </button>
      </div>

      {error && (
        <p className="text-xs" style={{ color: "#f87171" }}>{error}</p>
      )}

      {rows !== null && (
        <>
          {resolvedId && (
            <p className="font-mono text-[10px]" style={{ color: "rgba(255,255,255,0.25)" }}>
              user_id: {resolvedId}
            </p>
          )}

          {/* Verdict */}
          <div
            className="rounded-xl px-4 py-3 text-center font-bold"
            style={
              isClean
                ? { background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", color: "#4ade80" }
                : { background: "rgba(228,0,43,0.08)", border: "1px solid rgba(228,0,43,0.2)", color: "#f87171" }
            }
          >
            {isClean ? "LIMPIO ✅" : `SOSPECHOSO 🚨 — ${suspicious.length} predicción${suspicious.length !== 1 ? "es" : ""} fuera de tiempo`}
          </div>

          {rows.length === 0 && (
            <p className="text-xs text-center py-4" style={{ color: "rgba(255,255,255,0.3)" }}>
              Sin historial de predicciones.
            </p>
          )}

          <div className="space-y-2">
            {rows.map((r) => {
              const sus = isSuspicious(r);
              return (
                <div
                  key={r.id}
                  className="rounded-xl px-3 py-2.5 text-xs space-y-1"
                  style={{
                    background: sus ? "rgba(228,0,43,0.06)" : "rgba(255,255,255,0.03)",
                    border: sus ? "1px solid rgba(228,0,43,0.25)" : "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-bold" style={{ color: sus ? "#f87171" : "rgba(255,255,255,0.8)" }}>
                      {r.matches?.home_team?.code ?? "?"} vs {r.matches?.away_team?.code ?? "?"} (#{r.match_id})
                    </span>
                    {sus && (
                      <span
                        className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                        style={{ background: "rgba(228,0,43,0.2)", color: "#f87171" }}
                      >
                        FUERA DE TIEMPO
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3" style={{ color: "rgba(255,255,255,0.5)" }}>
                    {r.old_home !== null ? (
                      <span>
                        <span className="font-mono">{r.old_home} – {r.old_away}</span>
                        <span style={{ color: "rgba(255,255,255,0.2)" }}> → </span>
                        <span className="font-mono font-semibold" style={{ color: sus ? "#f87171" : "white" }}>
                          {r.new_home} – {r.new_away}
                        </span>
                      </span>
                    ) : (
                      <span>
                        Inicial:{" "}
                        <span className="font-mono font-semibold" style={{ color: sus ? "#f87171" : "white" }}>
                          {r.new_home} – {r.new_away}
                        </span>
                      </span>
                    )}
                    <span className="ml-auto" style={{ color: sus ? "rgba(248,113,113,0.6)" : "rgba(255,255,255,0.25)" }}>
                      {fmt(r.changed_at)}
                    </span>
                  </div>
                  {r.matches?.scheduled_at && (
                    <p style={{ color: "rgba(255,255,255,0.2)", fontSize: "10px" }}>
                      Cierre: {fmt(new Date(new Date(r.matches.scheduled_at).getTime() - 5 * 60 * 1000).toISOString())}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function AuditSection() {
  return (
    <div className="mt-8 space-y-6">
      <div
        className="pb-2"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}
      >
        <h2 className="font-bold text-base text-white">Auditoría</h2>
      </div>

      <div
        className="rounded-2xl p-4"
        style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}
      >
        <ResultAuditPanel />
      </div>

      <div
        className="rounded-2xl p-4"
        style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}
      >
        <UserVerifierPanel />
      </div>
    </div>
  );
}
