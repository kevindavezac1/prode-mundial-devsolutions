"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Sponsor = {
  id: string;
  nombre: string;
  logo_url: string | null;
  descripcion: string | null;
  link_url: string | null;
  orden: number;
};

export function SponsorsCarousel() {
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [current, setCurrent] = useState(0);
  const [visible, setVisible] = useState(true);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("sponsors")
      .select("id, nombre, logo_url, descripcion, link_url, orden")
      .eq("activo", true)
      .order("orden")
      .then(({ data }) => {
        if (data && data.length > 0) setSponsors(data);
      });
  }, []);

  useEffect(() => {
    if (sponsors.length <= 1) return;
    timerRef.current = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setCurrent((i) => (i + 1) % sponsors.length);
        setVisible(true);
      }, 300);
    }, 4000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [sponsors.length]);

  if (sponsors.length === 0) return null;

  const sponsor = sponsors[current];

  function goTo(i: number) {
    if (i === current) return;
    setVisible(false);
    setTimeout(() => { setCurrent(i); setVisible(true); }, 300);
  }

  return (
    <div className="px-4 pt-3 pb-1">
      <a
        href={sponsor.link_url ?? undefined}
        target="_blank"
        rel="noopener noreferrer"
        className="block"
        style={{ opacity: visible ? 1 : 0, transition: "opacity 0.3s ease" }}
        onClick={(e) => { if (!sponsor.link_url) e.preventDefault(); }}
      >
        <div
          className="flex items-center gap-3 rounded-2xl px-4"
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.08)",
            height: "90px",
          }}
        >
          <div
            className="w-[50px] h-[50px] rounded-full shrink-0 flex items-center justify-center overflow-hidden"
            style={{
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.12)",
            }}
          >
            {sponsor.logo_url ? (
              <img src={sponsor.logo_url} alt={sponsor.nombre} className="w-full h-full object-cover" />
            ) : (
              <span className="text-sm font-bold" style={{ color: "rgba(255,255,255,0.5)" }}>
                {sponsor.nombre.slice(0, 2).toUpperCase()}
              </span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm text-white truncate">{sponsor.nombre}</p>
            {sponsor.descripcion && (
              <p className="text-xs mt-0.5 truncate" style={{ color: "rgba(255,255,255,0.45)" }}>
                {sponsor.descripcion}
              </p>
            )}
          </div>

          <span
            className="text-[9px] font-bold shrink-0"
            style={{ color: "rgba(255,255,255,0.2)", letterSpacing: "1px" }}
          >
            SPONSOR
          </span>
        </div>
      </a>

      {sponsors.length > 1 && (
        <div className="flex justify-center gap-1.5 mt-2">
          {sponsors.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className="rounded-full"
              style={{
                width: i === current ? "16px" : "6px",
                height: "6px",
                background: i === current ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.2)",
                transition: "width 0.2s ease, background 0.2s ease",
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
