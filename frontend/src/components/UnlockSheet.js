import React, { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { useGuest } from "@/lib/guest";

export default function UnlockSheet({ episode, onUnlocked, onClose }) {
  const { guest, setCoins } = useGuest();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const coins = guest?.coins ?? 0;
  const enough = coins >= episode.cost;

  const unlock = async () => {
    setBusy(true);
    try {
      const { data } = await api.post(`/episodes/${episode.id}/unlock`);
      setCoins(data.coins);
      onUnlocked(episode);
    } catch {
      setBusy(false);
    }
  };

  return (
    <div className="absolute inset-0 z-40 flex items-end bg-black/60" onClick={onClose}>
      <motion.div
        role="dialog"
        aria-label={`Unlock episode ${episode.number}`}
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        transition={{ type: "spring", damping: 30, stiffness: 320 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full rounded-t-3xl bg-surface px-5 pb-[max(env(safe-area-inset-bottom),20px)] pt-6 shadow-2xl"
      >
        <h2 className="text-2xl font-semibold">Unlock episode {episode.number}</h2>
        <p className="mt-1 text-muted">
          Episodes 1–5 are free. Every episode after costs <span className="font-semibold text-accent">{episode.cost} coins</span>.
        </p>
        <p className="mt-4 text-lg tabular-nums">Your balance: <span className="font-semibold">{coins} coins</span></p>
        {enough ? (
          <button onClick={unlock} disabled={busy} className="press mt-5 w-full rounded-xl bg-accent py-3.5 text-[17px] font-semibold text-white disabled:opacity-60">
            Unlock for {episode.cost} coins
          </button>
        ) : (
          <button onClick={() => navigate("/profile")} className="press mt-5 w-full rounded-xl bg-white py-3.5 text-[17px] font-semibold text-black">
            Get more coins
          </button>
        )}
        <button onClick={onClose} className="press mt-2 w-full rounded-xl py-3 text-[17px] text-muted">Not now</button>
      </motion.div>
    </div>
  );
}
