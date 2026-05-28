"use client";

import { FlagEmoji } from "@/components/match/FlagEmoji";
import type { Team } from "@/types/matches";

type Props = {
  teams: Team[];
  search: string;
  onSearchChange: (s: string) => void;
  onSelect: (team: Team) => void;
  onClose: () => void;
};

export function TeamPicker({ teams, search, onSearchChange, onSelect, onClose }: Props) {
  const filtered = search
    ? teams.filter((t) => t.name.toLowerCase().includes(search.toLowerCase()))
    : teams;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50"
        style={{ background: "rgba(0,0,0,0.75)" }}
        onClick={onClose}
      />

      {/* Bottom sheet */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl flex flex-col"
        style={{
          background: "#0d1120",
          maxHeight: "82vh",
          borderTop: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        {/* Header */}
        <div className="px-4 pt-4 pb-3 flex items-center justify-between shrink-0">
          <h3 className="font-bold text-white text-base">Filtrar por equipo</h3>
          <button
            onClick={onClose}
            className="text-xl leading-none p-1"
            style={{ color: "rgba(255,255,255,0.45)" }}
          >
            ✕
          </button>
        </div>

        {/* Search */}
        <div className="px-4 pb-3 shrink-0">
          <input
            type="text"
            placeholder="Buscar equipo..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            autoFocus
            className="w-full px-3 py-2.5 rounded-xl text-sm text-white focus:outline-none"
            style={{
              background: "rgba(255,255,255,0.07)",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          />
        </div>

        {/* Team grid */}
        <div className="overflow-y-auto flex-1 px-4 pb-6">
          {filtered.length === 0 ? (
            <p className="text-center py-10 text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>
              Sin resultados
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {filtered.map((team) => (
                <button
                  key={team.id}
                  onClick={() => onSelect(team)}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-left transition-all active:scale-95"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <FlagEmoji
                    code={team.code}
                    flagUrl={team.flag_url}
                    className="w-7 h-7 rounded-full object-cover object-center shrink-0"
                    alt={team.name}
                  />
                  <span className="text-xs font-medium text-white truncate">{team.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
