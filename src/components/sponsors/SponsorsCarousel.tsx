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
        if (data && data.length > 0) {
          setSponsors(data);
          data.forEach((s) => {
            if (s.logo_url) {
              const img = new Image();
              img.src = s.logo_url;
            }
          });
        }
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
          className="flex items-center gap-4 rounded-2xl overflow-hidden"
          style={{
            background: "linear-gradient(135deg, #0d1120 0%, #0a0d18 100%)",
            border: "1px solid rgba(212,175,55,0.3)",
            height: "90px",
            padding: "0 16px",
          }}
        >
          {/* Logo */}
          <div
            className="w-[70px] h-[70px] rounded-xl shrink-0 flex items-center justify-center overflow-hidden"
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            {sponsor.logo_url ? (
              <img src={sponsor.logo_url} alt={sponsor.nombre} className="w-full h-full object-cover" />
            ) : (
              <span className="text-xl font-bold" style={{ color: "rgba(255,255,255,0.35)" }}>
                {sponsor.nombre.slice(0, 2).toUpperCase()}
              </span>
            )}
          </div>

          {/* Text */}
          <div className="flex-1 min-w-0">
            <span
              className="inline-block text-[8px] font-bold px-1.5 py-0.5 rounded mb-1"
              style={{
                background: "rgba(212,175,55,0.1)",
                color: "rgba(212,175,55,0.65)",
                letterSpacing: "1px",
                border: "1px solid rgba(212,175,55,0.2)",
              }}
            >
              PATROCINADOR
            </span>
            <p className="font-bold text-base text-white truncate leading-tight">{sponsor.nombre}</p>
            {sponsor.descripcion && (
              <p className="text-xs truncate mt-0.5" style={{ color: "rgba(255,255,255,0.5)" }}>
                {sponsor.descripcion}
              </p>
            )}
          </div>

          {/* CTA */}
          {sponsor.link_url && (
            <span
              className="text-xs font-semibold shrink-0"
              style={{ color: "rgba(212,175,55,0.7)", whiteSpace: "nowrap" }}
            >
              Ver más →
            </span>
          )}
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
                background: i === current ? "rgba(212,175,55,0.6)" : "rgba(255,255,255,0.2)",
                transition: "width 0.2s ease, background 0.2s ease",
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
