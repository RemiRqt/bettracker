import { SPORT_EMOJIS } from "@/lib/constants";

interface TeamLogoProps {
  logoUrl?: string | null;
  sport?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "h-6 w-6",
  md: "h-8 w-8",
  lg: "h-10 w-10",
};

const emojiSizeClasses = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-lg",
};

export function TeamLogo({
  logoUrl,
  sport = "football",
  size = "md",
  className = "",
}: TeamLogoProps) {
  const emoji = SPORT_EMOJIS[sport] || SPORT_EMOJIS.default;

  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt=""
        className={`${sizeClasses[size]} rounded-full object-contain ${className}`}
      />
    );
  }

  return (
    <div
      className={`${sizeClasses[size]} rounded-full bg-[#0f172a] border border-slate-600 flex items-center justify-center flex-shrink-0 ${className}`}
    >
      <span className={emojiSizeClasses[size]}>{emoji}</span>
    </div>
  );
}
