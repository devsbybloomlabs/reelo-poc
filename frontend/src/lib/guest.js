import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api, getStoredGuestId, storeGuestId } from "@/lib/api";

const GuestContext = createContext(null);
export const useGuest = () => useContext(GuestContext);

export function GuestProvider({ children }) {
  const [guest, setGuest] = useState(null);

  useEffect(() => {
    api.post("/guest").then(({ data }) => {
      storeGuestId(data.id);
      setGuest(data);
    });
  }, []);

  const refresh = useCallback(async () => {
    const { data } = await api.get("/me");
    setGuest(data);
  }, []);

  const setCoins = useCallback((coins) => setGuest((g) => (g ? { ...g, coins } : g)), []);

  const toggleList = useCallback(async (seriesId) => {
    let saved = false;
    setGuest((g) => {
      if (!g) return g;
      saved = g.list.includes(seriesId);
      return { ...g, list: saved ? g.list.filter((id) => id !== seriesId) : [...g.list, seriesId] };
    });
    try {
      await (saved ? api.delete(`/list/${seriesId}`) : api.post(`/list/${seriesId}`));
    } catch {
      refresh();
    }
  }, [refresh]);

  const toggleFollow = useCallback(async (seriesId) => {
    let was = false;
    setGuest((g) => {
      if (!g) return g;
      const cur = g.following ?? [];
      was = cur.includes(seriesId);
      return { ...g, following: was ? cur.filter((id) => id !== seriesId) : [...cur, seriesId] };
    });
    try {
      await (was ? api.delete(`/follow/${seriesId}`) : api.post(`/follow/${seriesId}`));
    } catch {
      refresh();
    }
  }, [refresh]);

  const isFollowing = useCallback((seriesId) => !!guest && (guest.following ?? []).includes(seriesId), [guest]);

  const inList = useCallback((seriesId) => !!guest && guest.list.includes(seriesId), [guest]);

  return (
    <GuestContext.Provider value={{ guest, refresh, setCoins, toggleList, inList, toggleFollow, isFollowing }}>
      {children}
    </GuestContext.Provider>
  );
}

export { getStoredGuestId };
