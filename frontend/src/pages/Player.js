import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { api } from "@/lib/api";
import { useGuest } from "@/lib/guest";
import UnlockSheet from "@/components/UnlockSheet";
import VideoOverlay from "@/components/VideoOverlay";
import VideoSlide from "@/components/VideoSlide";

export default function Player() {
  const { seriesId } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { guest } = useGuest();
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

  if (!series) return <div className="grid h-full place-items-center text-muted">Loading…</div>;
  const idx = current ? current.number - 1 : 0;

  return (
    <div className="relative h-full bg-black">
      <div ref={scroller} className="no-scrollbar h-full snap-y snap-mandatory overflow-y-auto">
        {series.episodes.map((ep, i) => (
          <VideoSlide key={ep.id} episode={ep} active={current?.id === ep.id}
                 near={Math.abs(i - idx) <= 1} onVisible={onVisible} onLockedTap={setSheet} />
        ))}
      </div>

      <button onClick={() => navigate(-1)} aria-label="Back" className="press absolute left-4 top-[max(env(safe-area-inset-top),16px)] z-20 grid h-10 w-10 place-items-center rounded-full bg-black/50 backdrop-blur-md">
        <ArrowLeft size={22} />
      </button>

      <VideoOverlay
        series={series}
        subtitle={`Episode ${current?.number ?? 1} of ${series.episode_count}`}
        watchLabel="Episodes"
        onWatch={() => navigate(`/series/${series.id}`)}
      />

      {sheet && <UnlockSheet episode={sheet} onUnlocked={onUnlocked} onClose={() => setSheet(null)} />}
    </div>
  );
}
