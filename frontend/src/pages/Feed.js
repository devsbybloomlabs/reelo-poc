import React, { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { api } from "@/lib/api";
import { useGuest } from "@/lib/guest";
import VideoOverlay from "@/components/VideoOverlay";
import VideoSlide from "@/components/VideoSlide";

// Vertical feed: one series per swipe, playing its free first episode.
export default function Feed() {
  const { guest } = useGuest();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    api.get("/feed").then((r) => setItems(r.data));
  }, []);

  const onVisible = useCallback(
    (ep) => setIdx(Math.max(0, items.findIndex((s) => s.first_episode.id === ep.id))),
    [items]
  );

  if (!guest || !items.length) return <div className="grid h-full place-items-center text-muted">Loading…</div>;

  return (
    <div className="relative h-full bg-black">
      <div className="no-scrollbar h-full snap-y snap-mandatory overflow-y-auto">
        {items.map((s, i) => {
          const episode = { id: s.first_episode.id, number: 1, video_url: s.first_episode.video_url, locked: false, cost: 0 };
          return (
            <VideoSlide key={s.id} episode={episode} active={i === idx} near={Math.abs(i - idx) <= 1}
                        onVisible={onVisible} onLockedTap={() => {}}>
              <VideoOverlay series={s} bottom="bottom-[72px]" onWatch={() => navigate(`/watch/${s.id}?ep=1`)} />
            </VideoSlide>
          );
        })}
      </div>
      <Link to="/search" aria-label="Search" className="press absolute right-4 top-[max(env(safe-area-inset-top),16px)] z-20 grid h-10 w-10 place-items-center rounded-full bg-black/40 backdrop-blur-md">
        <Search size={22} />
      </Link>
    </div>
  );
}
