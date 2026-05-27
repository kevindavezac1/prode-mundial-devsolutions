import type { FC } from "react";

interface TopHeaderProps {
  userPoints: number;
}

const TopHeader: FC<TopHeaderProps> = ({ userPoints }) => {
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
    </header>
  );
};

export default TopHeader;