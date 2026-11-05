import React, { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Check, Lock, Play, Plus } from "lucide-react";
import { api } from "@/lib/api";
import { useGuest } from "@/lib/guest";
import Poster from "@/components/Poster";

export default function SeriesDetail() {
  const { seriesId } = useParams();
  const navigate = useNavigate();
  const { guest, toggleList, inList } = useGuest();
  const [series, setSeries] = useState(null);

  const load = useCallback(() => api.get(`/series/${seriesId}`).then((r) => setSeries(r.data)), [seriesId]);
  useEffect(() => { if (guest) load(); }, [guest, load]);

  if (!series) return <div className="p-6 pt-20 text-muted">Loading…</div>;

  return (
    <article>
      <div className="relative">
        <Poster series={series} className="aspect-[3/4] w-full" showTitle={false} />
        <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/30 to-transparent" />
        <button onClick={() => navigate(-1)} aria-label="Back" className="press absolute left-4 top-[max(env(safe-area-inset-top),16px)] grid h-10 w-10 place-items-center rounded-full bg-black/50 backdrop-blur-md">
          <ArrowLeft size={22} />
        </button>
        <div className="absolute inset-x-0 bottom-0 px-5">
          <h1 className="font-display text-[30px] font-extrabold uppercase leading-[0.95] tracking-tight">{series.title}</h1>
        </div>
      </div>
      <div className="px-5 pt-3">
        <p className="text-muted">{series.tags.join(" · ")} · {series.episode_count} episodes</p>
        <p className="mt-3 text-[17px] leading-relaxed">{series.synopsis}</p>
        <div className="mt-4 flex gap-2">
          <button onClick={() => navigate(`/watch/${series.id}`)} className="press flex flex-1 items-center justify-center gap-2 rounded-xl bg-white py-3 text-[17px] font-semibold text-black">
            <Play size={20} fill="currentColor" aria-hidden="true" /> Play
          </button>
          <button onClick={() => toggleList(series.id)} aria-pressed={inList(series.id)} className="press flex flex-1 items-center justify-center gap-2 rounded-xl bg-surface py-3 text-[17px] font-medium">
            {inList(series.id) ? <Check size={20} aria-hidden="true" /> : <Plus size={20} aria-hidden="true" />} My List
          </button>
        </div>
        <h2 className="mt-8 text-[26px] font-semibold tracking-tight">Episodes</h2>
        <div className="mt-3 grid grid-cols-5 gap-2">
          {series.episodes.map((ep) => (
            <button
              key={ep.id}
              onClick={() => navigate(`/watch/${series.id}?ep=${ep.number}`)}
              aria-label={`Episode ${ep.number}${ep.locked ? ", locked" : ""}`}
              className="press relative grid aspect-square place-items-center rounded-xl bg-surface text-[17px] font-semibold tabular-nums"
            >
              {ep.number}
              {ep.locked && <Lock size={12} className="absolute right-1.5 top-1.5 text-accent" aria-hidden="true" />}
            </button>
          ))}
        </div>
      </div>
    </article>
  );
}
