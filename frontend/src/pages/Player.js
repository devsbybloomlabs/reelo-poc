import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, Bookmark, Lock, Share2, LayoutGrid } from "lucide-react";
import { api, mediaUrl } from "@/lib/api";
import { useGuest } from "@/lib/guest";
import UnlockSheet from "@/components/UnlockSheet";

function Slide({ episode, series, active, near, onVisible, onLockedTap }) {
  const ref = useRef(null);
  const videoRef = useRef(null);
  const [progress, setProgress] = useState(0);
  const lastSave = useRef(0);

  useEffect(() => {
    const io = new IntersectionObserver(([e]) => e.isIntersecting && onVisible(episode), { threshold: 0.7 });
    io.observe(ref.current);
    return () => io.disconnect();
  }, [episode, onVisible]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (active && !episode.locked) { v.currentTime = 0; v.play().catch(() => {}); }
    else v.pause();
  }, [active, episode.locked]);

  const onTime = (e) => {
    const v = e.currentTarget;
    setProgress(v.duration ? v.currentTime / v.duration : 0);
    if (v.currentTime - lastSave.current > 5) {
      lastSave.current = v.currentTime;
      api.post("/progress", { episode_id: episode.id, position: v.currentTime }).catch(() => {});
    }
  };

  return (
    <section ref={ref} className="relative h-full w-full snap-start snap-always bg-black" aria-label={`Episode ${episode.number}`}>
      {near && !episode.locked ? (
        <video
          ref={videoRef}
          src={mediaUrl(episode.video_url)}
          className="h-full w-full object-cover"
          playsInline
          loop
          muted={false}
          preload="metadata"
          onTimeUpdate={onTime}
          onClick={(e) => (e.currentTarget.paused ? e.currentTarget.play() : e.currentTarget.pause())}
        />
      ) : episode.locked ? (
        <button onClick={() => onLockedTap(episode)} className="grid h-full w-full place-items-center">
          <span className="flex flex-col items-center gap-3">
            <Lock size={40} className="text-accent" aria-hidden="true" />
            <span className="text-xl font-semibold">Episode {episode.number} is locked</span>
            <span className="rounded-xl bg-accent px-5 py-3 font-semibold">Unlock for {episode.cost} coins</span>
          </span>
        </button>
      ) : null}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1 bg-white/20">
        <div className="h-full bg-white" style={{ width: `${progress * 100}%` }} />
      </div>
    </section>
  );
}

export default function Player() {
  const { seriesId } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { guest, toggleList, inList } = useGuest();
  const [series, setSeries] = useState(null);
  const [current, setCurrent] = useState(null);
  const [sheet, setSheet] = useState(null);
  const scroller = useRef(null);

  useEffect(() => {
    if (guest) api.get(`/series/${seriesId}`).then((r) => setSeries(r.data));
  }, [guest, seriesId]);

  // Jump to the requested episode (or the first one) once the list is ready.
  useEffect(() => {
    if (!series) return;
    const n = Number(params.get("ep")) || 1;
    scroller.current?.children[n - 1]?.scrollIntoView();
    setCurrent(series.episodes[n - 1]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [series?.id]);

  const onVisible = useCallback((ep) => {
    setCurrent(ep);
    if (ep.locked) setSheet(ep);
  }, []);

  const onUnlocked = (ep) => {
    setSeries((s) => ({ ...s, episodes: s.episodes.map((e) => (e.id === ep.id ? { ...e, locked: false } : e)) }));
    setSheet(null);
  };

  const share = async () => {
    const url = window.location.origin + `/series/${seriesId}`;
    try { navigator.share ? await navigator.share({ title: series.title, url }) : await navigator.clipboard.writeText(url); } catch { /* cancelled */ }
  };

  if (!series) return <div className="grid h-full place-items-center text-muted">Loading…</div>;
  const idx = current ? current.number - 1 : 0;

  return (
    <div className="relative h-full bg-black">
      <div ref={scroller} className="no-scrollbar h-full snap-y snap-mandatory overflow-y-auto">
        {series.episodes.map((ep, i) => (
          <Slide key={ep.id} episode={ep} series={series} active={current?.id === ep.id}
                 near={Math.abs(i - idx) <= 1} onVisible={onVisible} onLockedTap={setSheet} />
        ))}
      </div>

      <button onClick={() => navigate(-1)} aria-label="Back" className="press absolute left-4 top-[max(env(safe-area-inset-top),16px)] z-20 grid h-10 w-10 place-items-center rounded-full bg-black/50 backdrop-blur-md">
        <ArrowLeft size={22} />
      </button>

      <div className="absolute bottom-24 right-3 z-20 flex flex-col items-center gap-5">
        <button onClick={() => toggleList(series.id)} aria-pressed={inList(series.id)} className="press flex flex-col items-center gap-1 text-xs">
          <Bookmark size={30} fill={inList(series.id) ? "currentColor" : "none"} /> My List
        </button>
        <button onClick={share} className="press flex flex-col items-center gap-1 text-xs"><Share2 size={28} /> Share</button>
        <button onClick={() => navigate(`/series/${series.id}`)} className="press flex flex-col items-center gap-1 text-xs"><LayoutGrid size={28} /> Episodes</button>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/80 to-transparent px-4 pb-6 pt-24">
        <h1 className="text-xl font-semibold">{series.title}</h1>
        <p className="text-muted">Episode {current?.number ?? 1} of {series.episode_count}</p>
      </div>

      {sheet && <UnlockSheet episode={sheet} onUnlocked={onUnlocked} onClose={() => setSheet(null)} />}
    </div>
  );
}
