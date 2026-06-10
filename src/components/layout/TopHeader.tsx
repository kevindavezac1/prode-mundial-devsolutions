import type { FC } from "react";
import Link from "next/link";

const SUPABASE_STORAGE_PREFIX = `${process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""}/storage/`;
function isTrustedUrl(url: string | null | undefined): url is string {
  return !!url && url.startsWith(SUPABASE_STORAGE_PREFIX);
}

interface TopHeaderProps {
  userPoints: number;
  avatarUrl?: string | null;
  displayName?: string | null;
}

const TopHeader: FC<TopHeaderProps> = ({ userPoints, avatarUrl, displayName }) => {
  const initial = displayName ? displayName.charAt(0).toUpperCase() : "?";

  return (
    <header
      className="sticky top-0 z-40 h-14 flex items-center justify-between px-4"
      style={{
        background: "linear-gradient(180deg, #07090f 0%, #0a1428 100%)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <span
        className="text-white font-display text-base"
        style={{ letterSpacing: "2px" }}
      >
        🏆 PRODE MUNDIAL 2026
      </span>

      <div className="flex items-center gap-2">
        <div
          className="flex items-center gap-1 px-3 py-1 rounded-full"
          style={{
            background: "rgba(212,175,55,0.1)",
            border: "1px solid rgba(212,175,55,0.2)",
          }}
        >
          <span className="text-[10px]">⚡</span>
          <span
            className="font-display text-sm text-wc-gold"
            style={{ letterSpacing: "1px" }}
          >
            {userPoints.toLocaleString("es-AR")}
          </span>
        </div>

        <Link href="/profile">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden"
            style={{
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.15)",
            }}
          >
            {isTrustedUrl(avatarUrl) ? (
              <img src={avatarUrl} alt={displayName ?? ""} className="w-full h-full object-cover" />
            ) : (
              <span className="text-sm font-bold text-white">{initial}</span>
            )}
          </div>
        </Link>
      </div>
    </header>
  );
};

export default TopHeader;