import React from "react";
import { NavLink } from "react-router-dom";
import { Home, Bookmark, User } from "lucide-react";

const TABS = [
  { to: "/", label: "Home", icon: Home, end: true },
  { to: "/library", label: "My List", icon: Bookmark },
  { to: "/profile", label: "Profile", icon: User },
];

export default function BottomTabBar() {
  return (
    <nav
      aria-label="Primary"
      className="absolute bottom-0 inset-x-0 z-30 flex justify-around pt-2 pb-[max(env(safe-area-inset-bottom),12px)] bg-black/60 backdrop-blur-xl"
    >
      {TABS.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            `press flex flex-col items-center gap-1 px-5 py-1 text-xs font-medium ${isActive ? "text-ink" : "text-muted"}`
          }
        >
          <Icon size={24} strokeWidth={1.75} aria-hidden="true" />
          {label}
        </NavLink>
      ))}
    </nav>
  );
}
