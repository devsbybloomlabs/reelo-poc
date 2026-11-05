import React, { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Flame, RefreshCw, Search as SearchIcon, Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import { compact } from "@/lib/format";
import Poster from "@/components/Poster";

const HISTORY_KEY = "reelo.searchHistory";
const HISTORY_MAX = 8;
const HOT_PAGE = 4;

function readHistory() {
  try {
    const v = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
    return Array.isArray(v) ? v : [];
  } catch { return []; }
}
function writeHistory(list) {
  try { localStorage.setItem(HISTORY_KEY, JSON.stringify(list)); } catch { /* storage unavailable */ }
}

function ResultCard({ series, rank }) {
  return (
    <Link to={`/series/${series.id}`} className="press flex items-center gap-3 rounded-2xl bg-surface p-3">
      <div className="relative w-[72px] shrink-0">
        <Poster series={series} className="aspect-[2/3] w-full rounded-lg" showTitle={false} />
        {rank && (
          <span className={`absolute left-0 top-0 rounded-br-lg rounded-tl-lg px-1.5 py-0.5 text-[11px] font-semibold ${rank <= 3 ? "bg-accent text-white" : "bg-black/70"}`}>
            Top {rank}
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 text-[17px] font-medium leading-snug">{series.title}</p>
        <p className="mt-1 line-clamp-1 text-xs text-muted">{series.themes.join(" | ")}</p>
      </div>
      <span className={`flex shrink-0 items-center gap-1 text-sm tabular-nums ${rank && rank <= 3 ? "text-accent" : "text-muted"}`}>
        <Flame size={14} aria-hidden="true" /> {compact(series.views)}
      </span>
    </Link>
  );
}

export default function Search() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const q = params.get("q") ?? "";
  const [text, setText] = useState(q);
  const [history, setHistory] = useState(readHistory);
  const [discover, setDiscover] = useState({ hot: [], trending: [] });
  const [page, setPage] = useState(0);
  const [results, setResults] = useState(null);

  useEffect(() => { api.get("/search/discover").then((r) => setDiscover(r.data)); }, []);

  useEffect(() => {
    setText(q);
    if (!q.trim()) { setResults(null); return; }
    let live = true;
    api.get("/search", { params: { q } }).then((r) => live && setResults(r.data));
    return () => { live = false; };
  }, [q]);

  const run = (term) => {
    const t = term.trim();
    if (!t) return;
    const next = [t, ...history.filter((h) => h.toLowerCase() !== t.toLowerCase())].slice(0, HISTORY_MAX);
    setHistory(next);
    writeHistory(next);
    setParams({ q: t });
  };

  const clear = () => { setHistory([]); writeHistory([]); };

  const pages = Math.max(1, Math.ceil(discover.hot.length / HOT_PAGE));
  const hot = discover.hot.slice(page * HOT_PAGE, page * HOT_PAGE + HOT_PAGE);

  return (
    <div className="px-4 pb-8 pt-[max(env(safe-area-inset-top),16px)]">
      <form
        onSubmit={(e) => { e.preventDefault(); run(text); }}
        className="flex items-center gap-3"
        role="search"
      >
        <button type="button" onClick={() => navigate(-1)} aria-label="Back" className="press grid h-10 w-10 shrink-0 place-items-center">
          <ArrowLeft size={24} />
        </button>
        <label className="flex h-11 min-w-0 flex-1 items-center gap-2 rounded-xl bg-surface px-3">
          <SearchIcon size={18} className="shrink-0 text-muted" aria-hidden="true" />
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Search titles or themes"
            aria-label="Search"
            autoFocus
            className="min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-muted"
          />
        </label>
        <button type="submit" className="press shrink-0 text-[15px] font-medium text-accent">Search</button>
      </form>

      {results ? (
        <section className="mt-6" aria-live="polite">
          {results.length === 0 ? (
            <p className="text-muted">No titles match “{q}”.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {results.map((s) => <ResultCard key={s.id} series={s} />)}
            </div>
          )}
        </section>
      ) : (
        <>
          {history.length > 0 && (
            <section className="mt-6">
              <div className="flex items-center justify-between">
                <h2 className="text-[17px] font-semibold">History</h2>
                <button onClick={clear} className="press flex items-center gap-1 text-sm text-muted">
                  <Trash2 size={16} aria-hidden="true" /> Clear
                </button>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {history.map((h) => (
                  <button key={h} onClick={() => run(h)} className="press rounded-lg bg-surface px-3 py-1.5 text-sm text-muted">{h}</button>
                ))}
              </div>
            </section>
          )}

          {discover.hot.length > 0 && (
            <section className="mt-6">
              <div className="flex items-center justify-between">
                <h2 className="flex items-center gap-1.5 text-[17px] font-semibold">
                  <Flame size={16} className="text-accent" aria-hidden="true" /> Everyone is searching
                </h2>
                <button onClick={() => setPage((p) => (p + 1) % pages)} className="press flex items-center gap-1 text-sm text-muted">
                  <RefreshCw size={15} aria-hidden="true" /> Refresh
                </button>
              </div>
              <div className="mt-3 flex flex-col items-start gap-2.5">
                {hot.map((h) => (
                  <button key={h} onClick={() => run(h)} className="press max-w-full truncate rounded-lg bg-surface px-3 py-2 text-sm">{h}</button>
                ))}
              </div>
            </section>
          )}

          {discover.trending.length > 0 && (
            <section className="mt-7">
              <h2 className="text-[17px] font-semibold">Trending</h2>
              <div className="mt-3 flex flex-col gap-3">
                {discover.trending.map((s, i) => <ResultCard key={s.id} series={s} rank={i + 1} />)}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
