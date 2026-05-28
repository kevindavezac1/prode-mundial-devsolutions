"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/dashboard", label: "PARTIDOS", icon: "⚽" },
  { href: "/leagues",   label: "LIGAS",    icon: "🏆" },
  { href: "/standings", label: "GRUPOS",   icon: "📋" },
  { href: "/rankings",  label: "RANKING",  icon: "📊" },
  { href: "/profile",   label: "PERFIL",   icon: "👤" },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 pb-[env(safe-area-inset-bottom)]"
      style={{
        background: "linear-gradient(180deg, #0a1428 0%, #07090f 100%)",
        borderTop: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <div className="h-16 flex items-center">
        {tabs.map((tab) => {
          const isActive =
            pathname === tab.href || pathname.startsWith(tab.href + "/");

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="flex-1 flex flex-col items-center justify-center gap-0.5 transition-opacity"
              style={{ opacity: isActive ? 1 : 0.4 }}
            >
              <span className="text-lg">{tab.icon}</span>
              <span
                className="text-[9px] font-bold text-white"
                style={{ letterSpacing: "1.5px" }}
              >
                {tab.label}
              </span>
              <div
                className="mt-0.5 h-0.5 rounded-full transition-all"
                style={{
                  width: isActive ? "16px" : "0px",
                  background: isActive ? "#E4002B" : "transparent",
                }}
              />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}