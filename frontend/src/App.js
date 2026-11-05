import React from "react";
import { Route, Routes } from "react-router-dom";
import PhoneFrame from "@/components/PhoneFrame";
import BottomTabBar from "@/components/BottomTabBar";
import Home from "@/pages/Home";
import Library from "@/pages/Library";
import Profile from "@/pages/Profile";

export default function App() {
  return (
    <PhoneFrame>
      <main className="h-full overflow-y-auto no-scrollbar pb-24">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/library" element={<Library />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </main>
      <BottomTabBar />
    </PhoneFrame>
  );
}
