import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import { useGuest } from "@/lib/guest";
import Poster from "@/components/Poster";

export default function Library() {
  const { guest } = useGuest();
  const [data, setData] = useState(null);

  useEffect(() => {
    if (guest) api.get("/library").then((r) => setData(r.data));
  }, [guest, guest?.list.length]);

  if (!data) return <div className="p-6 pt-20 text-muted">Loading…</div>;
  const empty = !data.saved.length && !data.continue_watching.length;

  return (
    <div className="px-5 pt-[max(env(safe-area-inset-top),20px)]">
      <h1 className="text-[32px] font-semibold tracking-tight">My List</h1>
      {empty && <p className="mt-6 text-muted">Nothing here yet. Tap + My List on any series to save it.</p>}

      {data.continue_watching.length > 0 && (
        <section className="mt-6">
          <h2 className="text-[22px] font-semibold">Continue watching</h2>
          <div className="mt-3 flex flex-col gap-3">
            {data.continue_watching.map((s) => (
              <Link key={s.id} to={`/watch/${s.id}?ep=${s.progress.number}`} className="press flex items-center gap-3 rounded-2xl bg-surface p-2">
                <Poster series={s} className="aspect-[2/3] w-16 shrink-0 rounded-xl" showTitle={false} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{s.title}</p>
                  <p className="text-sm text-muted">Episode {s.progress.number}</p>
                  <div className="mt-2 h-1 rounded bg-white/15">
                    <div className="h-full rounded bg-white" style={{ width: `${Math.min(100, (s.progress.position / s.progress.duration) * 100)}%` }} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {data.saved.length > 0 && (
        <section className="mt-8">
          <h2 className="text-[22px] font-semibold">Saved</h2>
          <div className="mt-3 grid grid-cols-3 gap-3">
            {data.saved.map((s) => (
              <Link key={s.id} to={`/series/${s.id}`} className="press">
                <Poster series={s} className="aspect-[2/3] w-full rounded-2xl" />
                <p className="mt-2 line-clamp-2 text-sm font-medium leading-snug">{s.title}</p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
