import React from "react";
import { Link } from "react-router-dom";
import { Bookmark, ChevronRight, Share2 } from "lucide-react";
import { useGuest } from "@/lib/guest";
import Poster from "@/components/Poster";

// Reference-style overlay: poster thumb + title + theme chips + synopsis + watch pill (left),
// Follow / Share (right). Sits above a bottom offset so it clears the tab bar when present.
export default function VideoOverlay({ series, watchLabel, onWatch, subtitle, bottom = "bottom-0" }) {
  const { toggleList, inList } = useGuest();
  const saved = inList(series.id);

  const share = async () => {
    const url = window.location.origin + `/series/${series.id}`;
    try {
      navigator.share ? await navigator.share({ title: series.title, url }) : await navigator.clipboard.writeText(url);
    } catch { /* cancelled */ }
  };

  return (
    <>
      <div className={`absolute inset-x-0 ${bottom} z-10 flex items-end gap-3 px-4 pb-5`}>
        <div /* taste-skill-ignore: neutral scrim over video */ className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-64 bg-gradient-to-t from-black/85 to-transparent" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2.5">
            <Link to={`/series/${series.id}`} aria-label={`${series.title} details`} className="press shrink-0">
              <Poster series={series} className="aspect-[2/3] w-10 rounded-md" />
            </Link>
            <Link to={`/series/${series.id}`} className="press flex min-w-0 items-center text-[17px] font-semibold leading-tight">
              <span className="truncate">{series.title}</span>
              <ChevronRight size={18} className="shrink-0" aria-hidden="true" />
            </Link>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {series.themes.map((t) => (
              <Link key={t} to={`/search?q=${encodeURIComponent(t)}`} className="press rounded-md bg-white/15 px-2 py-1 text-xs font-medium backdrop-blur-sm">
                {t} ›
              </Link>
            ))}
          </div>
          {subtitle && <p className="mt-2 text-sm text-ink/80">{subtitle}</p>}
          <p className="mt-2 line-clamp-2 text-sm leading-snug text-ink/80">{series.synopsis}</p>
          <button onClick={onWatch} className="press mt-3 flex items-center gap-1 rounded-lg bg-white/15 px-3.5 py-2.5 text-sm font-medium backdrop-blur-sm">
            {watchLabel ?? `Watch: Total ${series.episode_count} Episodes`}
            <ChevronRight size={16} aria-hidden="true" />
          </button>
        </div>
        <div className="flex shrink-0 flex-col items-center gap-3 pb-1">
          <button onClick={() => toggleList(series.id)} aria-pressed={saved} className="press flex flex-col items-center gap-1 text-xs font-medium">
            <span className="grid h-12 w-12 place-items-center rounded-full bg-white/15 backdrop-blur-md">
              <Bookmark size={22} fill={saved ? "currentColor" : "none"} />
            </span>
            {saved ? "Following" : "Follow"}
          </button>
          <button onClick={share} className="press flex flex-col items-center gap-1 text-xs font-medium">
            <span className="grid h-12 w-12 place-items-center rounded-full bg-white/15 backdrop-blur-md">
              <Share2 size={22} />
            </span>
            Share
          </button>
        </div>
      </div>
    </>
  );
}
