import React from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import PhoneFrame from "@/components/PhoneFrame";
import BottomTabBar from "@/components/BottomTabBar";
import Home from "@/pages/Home";
import Library from "@/pages/Library";
import Profile from "@/pages/Profile";
import SeriesDetail from "@/pages/SeriesDetail";
import Player from "@/pages/Player";
import Feed from "@/pages/Feed";
import Search from "@/pages/Search";

export default function App() {
  const { pathname } = useLocation();
  const immersive = pathname.startsWith("/watch") || pathname === "/for-you";
  const showTabs = !pathname.startsWith("/watch") && pathname !== "/search";
  return (
    <PhoneFrame>
      <main className={`h-full ${immersive ? "" : "overflow-y-auto no-scrollbar pb-24"}`}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/series/:seriesId" element={<SeriesDetail />} />
          <Route path="/search" element={<Search />} />
          <Route path="/for-you" element={<Feed />} />
          <Route path="/watch/:seriesId" element={<Player />} />
          <Route path="/library" element={<Library />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </main>
      {showTabs && <BottomTabBar solid={pathname === "/for-you"} />}
    </PhoneFrame>
  );
}
