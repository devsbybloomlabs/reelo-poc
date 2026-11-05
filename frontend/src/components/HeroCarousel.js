import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Play, Plus, Check } from "lucide-react";
import Poster from "@/components/Poster";
import { useGuest } from "@/lib/guest";

export default function HeroCarousel({ items }) {
  const scroller = useRef(null);
  const [active, setActive] = useState(0);
  const navigate = useNavigate();
  const { toggleList, inList } = useGuest();

  useEffect(() => setActive(0), [items]);

  const onScroll = () => {
    const el = scroller.current;
    if (!el) return;
    const card = el.firstElementChild;
    if (!card) return;
    const step = card.offsetWidth + 12;
    setActive(Math.min(items.length - 1, Math.max(0, Math.round(el.scrollLeft / step))));
  };

  return (
    <div
      ref={scroller}
      onScroll={onScroll}
      className="no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto px-[11%] pb-2"
      aria-roledescription="carousel"
    >
      {items.map((s, i) => (
        <article
          key={s.id}
          aria-label={s.title}
          className={`relative aspect-[2/3] w-[78%] shrink-0 snap-center overflow-hidden rounded-3xl border border-white/10 transition-opacity duration-300 ${
            i === active ? "opacity-100" : "opacity-60"
          }`}
        >
          <Link to={`/series/${s.id}`} aria-label={`Open ${s.title}`}>
            <Poster series={s} className="h-full w-full" showTitle={false} />
          </Link>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent px-4 pb-4 pt-24">
            <h2 className="font-display text-[28px] font-extrabold uppercase leading-[0.95] tracking-tight">{s.title}</h2>
            <p className="mt-2 text-[15px] text-ink/90">{s.tagline}</p>
            <div className="pointer-events-auto mt-3 flex gap-2">
              <button
                onClick={() => navigate(`/watch/${s.id}`)}
                className="press flex flex-1 items-center justify-center gap-2 rounded-xl bg-white py-3 text-[17px] font-semibold text-black"
              >
                <Play size={20} fill="currentColor" aria-hidden="true" /> Play
              </button>
              <button
                onClick={() => toggleList(s.id)}
                aria-pressed={inList(s.id)}
                className="press flex flex-1 items-center justify-center gap-2 rounded-xl bg-white/20 py-3 text-[17px] font-medium backdrop-blur-sm"
              >
                {inList(s.id) ? <Check size={20} aria-hidden="true" /> : <Plus size={20} aria-hidden="true" />} My List
              </button>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
