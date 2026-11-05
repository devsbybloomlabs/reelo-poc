import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Search, User } from "lucide-react";
import { useGuest } from "@/lib/guest";

const TOP_ZONE = 80; // within this many px of the top the bar never hides
const THRESHOLD = 8; // px of travel before the bar reacts, so small jitters don't flip it

// Sticky bar that slides away when the page scrolls down and returns on any scroll up.
export default function TopBar() {
  const { guest } = useGuest();
  const ref = useRef(null);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const scroller = ref.current?.closest("main");
    if (!scroller) return;
    let last = scroller.scrollTop;
    let ticking = false;

    const update = () => {
      const y = scroller.scrollTop;
      const delta = y - last;
      if (y < TOP_ZONE) { setHidden(false); last = y; }
      else if (delta > THRESHOLD) { setHidden(true); last = y; }
      else if (delta < -THRESHOLD) { setHidden(false); last = y; }
      ticking = false;
    };
    const onScroll = () => {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    };
    scroller.addEventListener("scroll", onScroll, { passive: true });
    return () => scroller.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      ref={ref}
      className={`sticky top-0 z-20 flex items-center justify-between bg-bg px-5 pt-[max(env(safe-area-inset-top),20px)] pb-3 transition-transform duration-200 ease-out ${
        hidden ? "-translate-y-full" : "translate-y-0"
      }`}
    >
      <Link to="/" className="font-display text-2xl font-extrabold tracking-tight text-accent" aria-label="Reelo home">
        reelo
      </Link>
      <div className="flex items-center gap-3">
        {guest && (
          <Link to="/profile" className="press rounded-full bg-surface px-3 py-1.5 text-sm font-semibold tabular-nums">
            {guest.coins} coins
          </Link>
        )}
        <Link to="/search" className="press p-2" aria-label="Search"><Search size={24} strokeWidth={1.75} /></Link>
        <Link to="/profile" className="press grid h-10 w-10 place-items-center rounded-full bg-surface" aria-label="Profile">
          <User size={20} strokeWidth={1.75} />
        </Link>
      </div>
    </header>
  );
}
