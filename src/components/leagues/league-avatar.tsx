type Props = {
  imageUrl: string | null;
  name: string;
  size?: "sm" | "lg";
};

function getInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0][0]?.toUpperCase() ?? "?";
  return (words[0][0]?.toUpperCase() ?? "") + (words[1][0]?.toUpperCase() ?? "");
}

export function LeagueAvatar({ imageUrl, name, size = "sm" }: Props) {
  const sizeClass = size === "lg" ? "w-16 h-16 text-2xl" : "w-7 h-7 text-xs";

  return (
    <div
      className={`${sizeClass} rounded-full flex items-center justify-center font-bold text-white shrink-0 overflow-hidden`}
      style={{
        background: imageUrl ? "transparent" : "rgba(228,0,43,0.15)",
        border: "1px solid rgba(228,0,43,0.25)",
      }}
    >
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageUrl} alt={name} className="w-full h-full object-cover" />
      ) : (
        getInitials(name)
      )}
    </div>
  );
}
