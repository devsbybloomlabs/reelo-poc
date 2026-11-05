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

  return (
    <GuestContext.Provider value={{ guest, refresh, setCoins }}>
      {children}
    </GuestContext.Provider>
  );
}
