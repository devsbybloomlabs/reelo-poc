import React from "react";
import { Link } from "react-router-dom";
import { Search, User } from "lucide-react";
import { useGuest } from "@/lib/guest";

export default function TopBar() {
  const { guest } = useGuest();
  return (
    <header className="flex items-center justify-between px-5 pt-[max(env(safe-area-inset-top),20px)] pb-3">
      <Link to="/" className="font-display text-2xl font-extrabold tracking-tight text-accent" aria-label="Reelo home">
        reelo
      </Link>
      <div className="flex items-center gap-3">
        {guest && (
          <Link to="/profile" className="press rounded-full bg-surface px-3 py-1.5 text-sm font-semibold tabular-nums">
            {guest.coins} coins
          </Link>
        )}
        <button className="press p-2" aria-label="Search"><Search size={24} strokeWidth={1.75} /></button>
        <Link to="/profile" className="press grid h-10 w-10 place-items-center rounded-full bg-surface" aria-label="Profile">
          <User size={20} strokeWidth={1.75} />
        </Link>
      </div>
    </header>
  );
}
