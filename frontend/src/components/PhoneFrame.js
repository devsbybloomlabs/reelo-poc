import React from "react";

// On phones the app fills the screen; on wider viewports it sits in a centred 430px column.
export default function PhoneFrame({ children }) {
  return (
    <div className="min-h-full w-full bg-[#050505] flex justify-center">
      <div
        className="relative h-[100dvh] w-full overflow-hidden bg-bg md:my-0 md:border-x md:border-white/10"
        style={{ maxWidth: "var(--frame-w)" }}
      >
        {children}
      </div>
    </div>
  );
}
