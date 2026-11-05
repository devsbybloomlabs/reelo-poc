import React, { useEffect, useRef, useState } from "react";
import { Lock } from "lucide-react";
import { api, mediaUrl } from "@/lib/api";

// One full-height snap slide: plays when active, pauses otherwise, saves progress.
export default function VideoSlide({ episode, active, near, onVisible, onLockedTap, children }) {
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
      {children}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1 bg-white/20">
        <div className="h-full bg-white" style={{ width: `${progress * 100}%` }} />
      </div>
    </section>
  );
}
