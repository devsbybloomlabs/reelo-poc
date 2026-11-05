import React, { useState } from "react";
import { mediaUrl } from "@/lib/api";

// Dark, saturated tones used when a poster image is missing, picked from the slug so each series is stable.
const TONES = ["#3a1f2b", "#1f2f3a", "#2e2a1c", "#1f3a2e", "#2b1f3a", "#3a2a1f", "#1c2e2e", "#3a1f1f"];
const toneFor = (slug = "") => TONES[[...slug].reduce((n, c) => n + c.charCodeAt(0), 0) % TONES.length];

export default function Poster({ series, className = "", showTitle = true }) {
  const [failed, setFailed] = useState(false);
  return (
    <div
      className={`relative overflow-hidden bg-surface ${className}`}
      style={failed ? { background: toneFor(series.slug) } : undefined}
    >
      {!failed && (
        <img
          src={mediaUrl(series.poster_url)}
          alt=""
          loading="lazy"
          draggable="false"
          onError={() => setFailed(true)}
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
      {failed && showTitle && (
        <span className="absolute inset-x-3 top-1/3 font-display text-lg font-extrabold leading-tight text-white/90">
          {series.title}
        </span>
      )}
    </div>
  );
}
