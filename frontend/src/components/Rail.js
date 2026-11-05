import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import Poster from "@/components/Poster";

export default function Rail({ title, items, progress = {} }) {
  if (!items.length) return null;
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="mt-8"
    >
      <h2 className="px-5 text-[26px] font-semibold leading-tight tracking-tight">{title}</h2>
      <div className="no-scrollbar mt-3 flex gap-3 overflow-x-auto px-5">
        {items.map((s) => (
          <Link key={s.id} to={`/series/${s.id}`} className="press w-[34%] shrink-0">
            <Poster series={s} className="aspect-[2/3] w-full rounded-2xl" />
            <p className="mt-2 line-clamp-2 text-[15px] font-medium leading-snug">{s.title}</p>
            {progress[s.id] && <p className="text-sm text-muted">Episode {progress[s.id].number}</p>}
          </Link>
        ))}
      </div>
    </motion.section>
  );
}
