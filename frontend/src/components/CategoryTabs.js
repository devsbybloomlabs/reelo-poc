import React from "react";

export default function CategoryTabs({ categories, active, onChange }) {
  return (
    <div role="tablist" aria-label="Categories" className="no-scrollbar flex gap-2 overflow-x-auto px-5 pb-4">
      {categories.map((c) => (
        <button
          key={c}
          role="tab"
          aria-selected={c === active}
          onClick={() => onChange(c)}
          className={`press shrink-0 rounded-xl px-4 py-2.5 text-[17px] font-medium ${
            c === active ? "bg-surface text-ink" : "text-ink/90"
          }`}
        >
          {c}
        </button>
      ))}
    </div>
  );
}
