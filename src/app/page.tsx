import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LandingPage } from "@/components/landing/landing-page";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const OG_IMAGE = `${SITE_URL}/logo_mundial.webp`;

export const metadata: Metadata = {
  title: "Prode Mundial 2026",
  description: "Predecí los partidos del Mundial. Competí con tus amigos. ¡Es gratis!",
  openGraph: {
    title: "Prode Mundial 2026",
    description: "Predecí los partidos del Mundial. Competí con tus amigos. ¡Es gratis!",
    url: SITE_URL,
    type: "website",
    images: [{ url: OG_IMAGE, width: 800, height: 800 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Prode Mundial 2026",
    description: "Predecí los partidos del Mundial. Competí con tus amigos. ¡Es gratis!",
    images: [OG_IMAGE],
  },
};

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) redirect("/dashboard");

  return <LandingPage />;
}
