import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Premios — Prode Mundial 2026" };

const SPONSOR_LOGOS: Record<string, string> = {
  "la-prose": "https://ldnbhttldhmewkksypwe.supabase.co/storage/v1/object/public/sponsors/0288af95-4941-4c28-af8d-cd1991298420/logo.png",
  "emebe": "https://ldnbhttldhmewkksypwe.supabase.co/storage/v1/object/public/sponsors/3ad106f8-2527-4055-be8f-03cee01d368f/logo.png",
  "men-store": "https://ldnbhttldhmewkksypwe.supabase.co/storage/v1/object/public/sponsors/64fcd957-ab0f-4e54-bf04-fb58f270d2e2/logo.png",
  "af-electricidad": "https://ldnbhttldhmewkksypwe.supabase.co/storage/v1/object/public/sponsors/6b743d35-76ef-4b30-8f30-9107dbd02dd9/logo.png",
  "isidoro": "https://ldnbhttldhmewkksypwe.supabase.co/storage/v1/object/public/sponsors/7b5bc27e-6f29-43f0-b28b-752f3b8613fd/logo.png",
  "vincent": "https://ldnbhttldhmewkksypwe.supabase.co/storage/v1/object/public/sponsors/964425b1-c0e6-4a32-8a21-7010c420ff40/logo.png",
  "hay-equipo": "https://ldnbhttldhmewkksypwe.supabase.co/storage/v1/object/public/sponsors/9914332e-585c-4173-b528-70d18119b2af/logo.jpg",
  "celumania": "https://ldnbhttldhmewkksypwe.supabase.co/storage/v1/object/public/sponsors/adc14b22-a64b-4d67-a953-41163751fd73/logo.png",
  "guardapampa": "https://ldnbhttldhmewkksypwe.supabase.co/storage/v1/object/public/sponsors/dd9a73cc-1112-4859-aa9b-fd868bcd514c/logo.png",
  "el-pasillo-barber": "https://ldnbhttldhmewkksypwe.supabase.co/storage/v1/object/public/sponsors/df1d3d05-9fc4-4c5b-a482-b8160a9991bc/logo.png",
  "la-forja": "https://ldnbhttldhmewkksypwe.supabase.co/storage/v1/object/public/sponsors/ee4776a7-6799-42c3-afe9-22dd1414dc00/logo.png",
  "el-club-medialunas": "https://ldnbhttldhmewkksypwe.supabase.co/storage/v1/object/public/sponsors/5c53767f-3831-4f5c-886d-24db20c38b34/logo.png",
};

const cardBase: React.CSSProperties = {
  background: "linear-gradient(160deg, #0d1120 0%, #07090f 100%)",
  borderRadius: 16,
  padding: 16,
  marginBottom: 12,
};

function Divider({ label }: { label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, marginTop: 24 }}>
      <div style={{ height: 1, flex: 1, background: "rgba(255,255,255,0.06)" }} />
      <span style={{ fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,0.3)", letterSpacing: "3px" }}>
        {label}
      </span>
      <div style={{ height: 1, flex: 1, background: "rgba(255,255,255,0.06)" }} />
    </div>
  );
}

interface PrizeCardProps {
  fase: string;
  condicion: string;
  premio: string;
  sponsor: string;
  sponsorKey?: string | null;
  border?: string;
  titleColor?: string;
  tagline?: string;
}

function PrizeCard({
  fase,
  condicion,
  premio,
  sponsor,
  sponsorKey,
  border = "rgba(255,255,255,0.08)",
  titleColor = "white",
  tagline,
}: PrizeCardProps) {
  const logoUrl = sponsorKey ? SPONSOR_LOGOS[sponsorKey] : null;

  return (
    <div style={{ ...cardBase, border: `1px solid ${border}` }}>
      {/* label */}
      <div style={{ fontSize: 9, fontWeight: 800, color: "rgba(255,255,255,0.3)", letterSpacing: "2px", marginBottom: 6 }}>
        {fase} · {condicion}
      </div>

      {/* premio + logo */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <p style={{ flex: 1, fontFamily: "var(--font-bebas)", fontSize: 28, color: titleColor, letterSpacing: "1px", lineHeight: 1 }}>
          {premio}
        </p>
        {logoUrl ? (
          <img
            src={logoUrl}
            alt={sponsor}
            style={{
              width: 60,
              height: 60,
              objectFit: "contain",
              borderRadius: 10,
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.08)",
              flexShrink: 0,
              padding: 4,
            }}
          />
        ) : (
          <div
            style={{
              width: 60,
              height: 60,
              borderRadius: 10,
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.08)",
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 18,
              fontWeight: 800,
              color: "rgba(255,255,255,0.3)",
            }}
          >
            {sponsor[0]}
          </div>
        )}
      </div>

      {/* sponsor name */}
      <div style={{ marginTop: 8 }}>
        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", letterSpacing: "0.5px" }}>
          {sponsor}
        </span>
        {tagline && (
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", fontStyle: "italic", marginTop: 4 }}>
            {tagline}
          </p>
        )}
      </div>
    </div>
  );
}

type SponsorRow = {
  id: string;
  nombre: string;
  logo_url: string | null;
  descripcion: string | null;
};

const SUPABASE_STORAGE_PREFIX = `${process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""}/storage/`;
function isTrustedUrl(url: string | null): url is string {
  return !!url && url.startsWith(SUPABASE_STORAGE_PREFIX);
}

export default async function PremiosPage() {
  const supabase = await createClient();
  const { data: sponsors } = await supabase
    .from("sponsors")
    .select("id, nombre, logo_url, descripcion")
    .eq("activo", true)
    .order("orden", { ascending: true });

  const sponsorList: SponsorRow[] = sponsors ?? [];

  return (
    <main className="min-h-screen pb-8">
      <header
        className="sticky top-0 z-10 backdrop-blur px-4 py-3 flex items-center gap-3"
        style={{ background: "rgba(7,9,15,0.95)", borderBottom: "1px solid rgba(255,255,255,0.07)" }}
      >
        <Link href="/dashboard" className="text-sm shrink-0" style={{ color: "rgba(255,255,255,0.5)" }}>‹ Volver</Link>
        <div>
          <h1 className="font-bold text-lg text-white">Premios</h1>
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>Prode Mundial 2026</p>
        </div>
      </header>
      <div className="p-4">

        {/* ── HERO: La Moto ── */}
        <div
          style={{
            position: "relative",
            overflow: "hidden",
            background: "linear-gradient(135deg, rgba(212,175,55,0.2) 0%, rgba(7,9,15,1) 100%)",
            border: "1px solid rgba(212,175,55,0.5)",
            borderRadius: 20,
            padding: 24,
            marginBottom: 8,
          }}
        >
          {/* top gold line */}
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg, transparent, rgba(212,175,55,0.7), transparent)" }} />


          <p style={{ fontSize: 9, fontWeight: 800, color: "rgba(212,175,55,0.7)", letterSpacing: "3px", marginBottom: 12 }}>
            PREMIO MAYOR
          </p>
          <p style={{ fontFamily: "var(--font-bebas)", fontSize: 40, color: "white", lineHeight: 0.9, marginBottom: 12, letterSpacing: "1px" }}>
            ¿PODÉS ACERTAR LOS 104?
          </p>
          <p style={{ fontWeight: 700, fontSize: 17, color: "white", lineHeight: 1.3, marginBottom: 8 }}>
            Quien acierte todos los partidos del Mundial exactos se lleva una moto.
          </p>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 1.5 }}>
            Si más de un participante lo logra, se realizará un sorteo entre ellos.
          </p>
        </div>

        {/* ── CALENDARIO DE PREMIOS ── */}
        <Divider label="CALENDARIO DE PREMIOS" />

        {/* Partidos de Argentina */}
        <Divider label="PARTIDOS DE ARGENTINA" />

        <PrizeCard fase="Argentina — Partido 1" condicion="Sorteo entre exactos" premio="TURNO DE PÁDEL" sponsor="Hay Equipo Premier Club" sponsorKey="hay-equipo" border="rgba(116,172,223,0.25)" />
        <PrizeCard fase="Argentina — Partido 2" condicion="Sorteo entre exactos" premio="DOCENA DE MEDIALUNAS" sponsor="El Club de las Medialunas" sponsorKey="el-club-medialunas" border="rgba(116,172,223,0.25)" />
        <PrizeCard fase="Argentina — Partido 3" condicion="Sorteo entre exactos" premio="CORTE DE PELO" sponsor="El Pasillo Barber" sponsorKey="el-pasillo-barber" border="rgba(116,172,223,0.25)" />

        {/* Partidos de Nueva Zelanda */}
        <Divider label="PARTIDOS DE NUEVA ZELANDA" />

        <PrizeCard fase="Nueva Zelanda — Partido 1" condicion="Sorteo entre exactos" premio="SESIÓN DE CENTRO DE BELLEZA" sponsor="La Prose" sponsorKey="la-prose" border="rgba(116,172,223,0.25)" tagline="Por Tim Pyne 🫡" />
        <PrizeCard fase="Nueva Zelanda — Partido 2" condicion="Sorteo entre exactos" premio="LÁMPARA DE ESTUDIO" sponsor="AF Electricidad" sponsorKey="af-electricidad" border="rgba(116,172,223,0.25)" />
        <PrizeCard fase="Nueva Zelanda — Partido 3" condicion="Sorteo entre exactos" premio="CORTE DE PELO" sponsor="El Pasillo Barber" sponsorKey="el-pasillo-barber" border="rgba(116,172,223,0.25)" />

        {/* Fase de Grupos */}
        <Divider label="FASE DE GRUPOS" />

        <PrizeCard fase="Fecha 1" condicion="Más puntos en la fecha · desempate por exactos" premio="JUEGO DE MESA" sponsor="Vincent Librería y Juguetería" sponsorKey="vincent" border="rgba(255,255,255,0.08)" />
        <PrizeCard fase="Fecha 2" condicion="Más puntos en la fecha · desempate por exactos" premio="AURICULAR" sponsor="Celumania" sponsorKey="celumania" border="rgba(255,255,255,0.08)" />
        <PrizeCard fase="Fecha 3" condicion="Más puntos en la fecha · desempate por exactos" premio="PARLANTE BLUETOOTH" sponsor="Celumania" sponsorKey="celumania" border="rgba(255,255,255,0.08)" />

        {/* Fases Eliminatorias */}
        <Divider label="FASES ELIMINATORIAS" />

        <PrizeCard fase="16avos de Final" condicion="Más puntos en la fase · desempate por exactos" premio="SHORT DEPORTIVO" sponsor="EMEBE Indumentaria" sponsorKey="emebe" border="rgba(255,255,255,0.08)" />
        <PrizeCard fase="Octavos de Final" condicion="Más puntos en la fase · desempate por exactos" premio="MATE IMPERIAL + BOMBILLA" sponsor="Guardapampa" sponsorKey="guardapampa" border="rgba(255,255,255,0.1)" />
        <PrizeCard fase="Cuartos de Final" condicion="Más puntos en la fase · desempate por puntos totales" premio="MES DE GIMNASIO GRATIS" sponsor="Hay Equipo Premier Club" sponsorKey="hay-equipo" border="rgba(255,255,255,0.12)" />
        <PrizeCard fase="Semifinal" condicion="Más puntos en la fase · desempate por puntos totales" premio="CAMPERA DEPORTIVA" sponsor="EMEBE Indumentaria" sponsorKey="emebe" border="rgba(255,255,255,0.15)" />

        {/* Gran Final */}
        <Divider label="GRAN FINAL" />

        <PrizeCard fase="3° Puesto" condicion="Más puntos totales del torneo · desempate por exactos totales" premio="CENA CON 40% DE DESCUENTO" sponsor="Isidoro" sponsorKey="isidoro" border="rgba(184,115,51,0.2)" />
        <PrizeCard fase="2° Puesto" condicion="Más puntos totales del torneo · desempate por exactos totales" premio="ORDEN DE COMPRA $50.000" sponsor="Men Store" sponsorKey="men-store" border="rgba(192,192,192,0.2)" />
        <PrizeCard fase="1° Puesto" condicion="Más puntos totales del torneo · desempate por exactos totales" premio="CENA PARA 2" sponsor="La Forja" sponsorKey="la-forja" border="rgba(212,175,55,0.4)" titleColor="#D4AF37" />

        {/* ── SPONSORS ── */}
        <Divider label="NUESTROS SPONSORS" />

        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12 }}>
          {sponsorList.map((s) => (
            <div
              key={s.id}
              style={{
                borderRadius: 16,
                padding: 12,
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.07)",
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <p className="font-bold text-sm text-white">
                  {s.nombre}
                </p>
                {s.descripcion && (
                  <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>
                    {s.descripcion}
                  </p>
                )}
              </div>
              {isTrustedUrl(s.logo_url) ? (
                <img
                  src={s.logo_url}
                  alt={s.nombre}
                  style={{
                    width: 64,
                    height: 64,
                    objectFit: "contain",
                    borderRadius: 12,
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    flexShrink: 0,
                    padding: 4,
                  }}
                />
              ) : (
                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 12,
                    background: "rgba(255,255,255,0.08)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 20,
                    fontWeight: 700,
                    color: "rgba(255,255,255,0.4)",
                  }}
                >
                  {s.nombre.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* ── CÓMO FUNCIONAN ── */}
        <div
          style={{
            ...cardBase,
            border: "1px solid rgba(255,255,255,0.07)",
            marginTop: 24,
            marginBottom: 12,
          }}
        >
          <p
            style={{
              fontFamily: "var(--font-bebas)",
              fontSize: 15,
              color: "white",
              letterSpacing: "3px",
              marginBottom: 12,
            }}
          >
            CÓMO FUNCIONAN LOS PREMIOS
          </p>

          {[
            { icon: "🇦🇷", titulo: "Partidos de Argentina y Nueva Zelanda", desc: "Sorteo entre todos los que acertaron el resultado exacto." },
            { icon: "📅", titulo: "Fechas fase de grupos (1, 2 y 3)", desc: "Gana quien hizo más puntos en esa fecha. Desempate: más predicciones exactas en la fecha. Si persiste empate: sorteo." },
            { icon: "⚔️", titulo: "16avos y Octavos de final", desc: "Gana quien hizo más puntos en la fase. Desempate: más predicciones exactas en la fase. Si persiste empate: sorteo." },
            { icon: "⚔️", titulo: "Cuartos y Semifinal", desc: "Gana quien hizo más puntos en la fase. Desempate: más puntos acumulados totales del torneo hasta ese momento. Si persiste empate: sorteo." },
            { icon: "🥇", titulo: "Final — Tabla general", desc: "Gana quien tenga más puntos totales del torneo. Desempate: más predicciones exactas totales. Si persiste empate: sorteo." },
            { icon: "🏍️", titulo: "Premio Mayor — La Moto", desc: "Para quien acierte los 104 partidos exactos. Si más de un participante lo logra, se realizará un sorteo entre ellos." },
          ].map(({ icon, titulo, desc }) => (
            <div
              key={titulo}
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 12,
                padding: 12,
                marginBottom: 8,
              }}
            >
              <p style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.85)", marginBottom: 4 }}>
                {icon} {titulo}
              </p>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", lineHeight: 1.5 }}>{desc}</p>
            </div>
          ))}

          <div
            style={{
              marginTop: 16,
              padding: 12,
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.05)",
              borderRadius: 12,
              fontSize: 10,
              color: "rgba(255,255,255,0.25)",
              lineHeight: 1.6,
              marginBottom: 8,
            }}
          >
            Los premios no serán eliminados. Su asignación por etapa puede desplazarse con un mínimo de 48 horas de anticipación pública.
          </div>

          <div
            style={{
              padding: 12,
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.05)",
              borderRadius: 12,
              fontSize: 10,
              color: "rgba(255,255,255,0.25)",
              lineHeight: 1.6,
            }}
          >
            Los premios son aportados por los sponsors mencionados. Prode Mundial 2026 actúa como organizador del sorteo y distribución. Los ganadores serán contactados por Instagram. Los premios no son canjeables por dinero en efectivo. En caso de no poder coordinar la entrega en un plazo de 7 días corridos desde el contacto, el premio pasará al siguiente participante elegible. La organización se reserva el derecho de modificar premios por otros de igual o mayor valor ante causas de fuerza mayor.
          </div>
        </div>

      </div>
    </main>
  );
}
