import React, { useState } from "react";
import { api } from "@/lib/api";
import { useGuest } from "@/lib/guest";

const PACKS = [
  { id: "small", coins: 300, price: "$2.99" },
  { id: "medium", coins: 700, price: "$5.99" },
  { id: "large", coins: 1500, price: "$11.99" },
];

export default function Profile() {
  const { guest, setCoins, refresh } = useGuest();
  const [note, setNote] = useState("");

  if (!guest) return <div className="p-6 pt-20 text-muted">Loading…</div>;

  const checkin = async () => {
    try {
      const { data } = await api.post("/checkin");
      setCoins(data.coins);
      setNote(`+${data.reward} coins. See you tomorrow.`);
      refresh();
    } catch {
      setNote("You already checked in today.");
    }
  };

  const topup = async (pack) => {
    const { data } = await api.post("/wallet/topup", { pack });
    setCoins(data.coins);
    setNote("Demo purchase complete. No real payment was made.");
  };

  return (
    <div className="px-5 pt-[max(env(safe-area-inset-top),20px)]">
      <h1 className="text-[32px] font-semibold tracking-tight">Profile</h1>

      <section className="mt-6 rounded-3xl bg-surface p-5">
        <p className="text-muted">Coin balance</p>
        <p className="mt-1 text-5xl font-semibold tabular-nums text-accent">{guest.coins}</p>
        <button
          onClick={checkin}
          disabled={guest.checked_in_today}
          className="press mt-4 w-full rounded-xl bg-white py-3 text-[17px] font-semibold text-black disabled:opacity-40"
        >
          {guest.checked_in_today ? "Checked in today" : "Daily check-in, +20 coins"}
        </button>
      </section>

      <h2 className="mt-8 text-[22px] font-semibold">Get coins</h2>
      <div className="mt-3 flex flex-col gap-2">
        {PACKS.map((p) => (
          <button key={p.id} onClick={() => topup(p.id)} className="press flex items-center justify-between rounded-2xl bg-surface px-5 py-4 text-left">
            <span className="text-xl font-semibold tabular-nums">{p.coins} coins</span>
            <span className="rounded-lg bg-accent px-3 py-1.5 font-semibold">{p.price}</span>
          </button>
        ))}
      </div>
      <p aria-live="polite" className="mt-4 min-h-6 text-sm text-muted">{note}</p>
      <p className="mt-6 break-all text-xs text-muted">Guest ID: {guest.id}</p>
    </div>
  );
}
