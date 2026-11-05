import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useGuest } from "@/lib/guest";
import TopBar from "@/components/TopBar";
import CategoryTabs from "@/components/CategoryTabs";
import HeroCarousel from "@/components/HeroCarousel";
import Rail from "@/components/Rail";

export default function Home() {
  const { guest } = useGuest();
  const [categories, setCategories] = useState(["For You"]);
  const [category, setCategory] = useState("For You");
  const [home, setHome] = useState(null);
  const [filtered, setFiltered] = useState([]);
  const [watching, setWatching] = useState([]);

  useEffect(() => {
    api.get("/categories").then((r) => setCategories(r.data));
    api.get("/home").then((r) => setHome(r.data));
  }, []);

  useEffect(() => {
    if (!guest) return;
    api.get("/library").then((r) => setWatching(r.data.continue_watching));
  }, [guest]);

  useEffect(() => {
    if (category === "For You") return;
    api.get("/series", { params: { category } }).then((r) => setFiltered(r.data));
  }, [category]);

  const forYou = category === "For You";
  const progress = Object.fromEntries(watching.map((s) => [s.id, s.progress]));
  const hero = forYou
    ? [...watching, ...(home?.hero ?? []).filter((s) => !progress[s.id])]
    : filtered;

  return (
    <>
      <TopBar />
      <CategoryTabs categories={categories} active={category} onChange={setCategory} />
      {hero.length > 0 && <HeroCarousel items={hero} progress={progress} />}
      {forYou
        ? home?.rails.map((r) => <Rail key={r.key} title={r.title} items={r.items} />)
        : <Rail title={`More ${category}`} items={filtered} />}
    </>
  );
}
