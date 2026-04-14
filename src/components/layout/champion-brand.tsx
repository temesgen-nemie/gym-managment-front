type ChampionBrandProps = {
  compact?: boolean;
  className?: string;
  tone?: "light" | "dark";
};

export function ChampionBrand({
  compact = false,
  className = "",
  tone = "light"
}: ChampionBrandProps) {
  const isDark = tone === "dark";
  const inkClass = isDark ? "text-white" : "text-[#111111]";
  const subClass = isDark ? "text-white/72" : "text-[#111111]/72";
  const badgeClass = isDark
    ? "border-[rgba(255,255,255,0.18)] bg-[rgba(255,255,255,0.08)]"
    : "border-[rgba(17,17,17,0.08)] bg-white";

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div
        className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-[24px] border ${
          compact ? "h-16 w-16" : "h-20 w-20"
        } ${badgeClass} shadow-[0_18px_45px_-26px_rgba(0,0,0,0.55)]`}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(244,171,32,0.42),transparent_38%),linear-gradient(160deg,rgba(255,255,255,0.92),rgba(255,255,255,0.65))]" />
        <svg
          viewBox="0 0 80 80"
          aria-hidden="true"
          className={`relative ${compact ? "h-12 w-12" : "h-14 w-14"}`}
        >
          <path
            d="M27 16c-4 0-7 2-10 5-5 5-8 10-8 15 0 7 4 12 11 16l8-2c-4-5-6-10-6-15 0-4 2-7 5-10 2-2 4-3 6-3 2 0 3 1 5 2l4-3c-1-4-5-5-9-5h-6Z"
            fill="#F4AB20"
          />
          <path
            d="M41 21c8 1 14 6 16 13l-6 8-10 3-11-3-2-9 6-10 7-2Z"
            fill="#F4AB20"
          />
          <path
            d="M35 33c3 0 5 2 6 4l4 11-7 13-12-2c-4-1-7-5-7-9 0-6 5-12 10-14l6-3Z"
            fill="#F4AB20"
          />
        </svg>
      </div>

      <div className="min-w-0">
        <p
          className={`leading-none ${inkClass} ${
            compact ? "text-[2rem]" : "text-[2.4rem] sm:text-[2.8rem]"
          } font-black italic tracking-[-0.06em]`}
        >
          Champion
        </p>
        <div className={`mt-1 flex items-center gap-3 ${subClass}`}>
          <div className="flex items-center gap-1 text-[#F4AB20]">
            <span className="h-3 w-1 rounded-full bg-current" />
            <span className="h-5 w-1 rounded-full bg-current" />
            <span className="h-7 w-1 rounded-full bg-current" />
            <span className={`h-1 ${compact ? "w-12" : "w-16"} rounded-full bg-current`} />
            <span className="h-7 w-1 rounded-full bg-current" />
            <span className="h-5 w-1 rounded-full bg-current" />
            <span className="h-3 w-1 rounded-full bg-current" />
          </div>
          <span className="text-sm font-black uppercase tracking-[0.34em]">Gym</span>
        </div>
      </div>
    </div>
  );
}
