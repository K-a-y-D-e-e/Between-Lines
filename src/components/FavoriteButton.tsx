"use client";

import { useState, useTransition } from "react";
import { Heart } from "lucide-react";
import { toggleFavorite } from "@/app/actions";

export function FavoriteButton({ writingId, initial }: { writingId: string; initial: boolean }) {
  const [saved, setSaved] = useState(initial);
  const [pending, start] = useTransition();

  return (
    <button
      type="button"
      aria-pressed={saved}
      disabled={pending}
      onClick={() => {
        const next = !saved;
        setSaved(next);
        start(async () => {
          const res = await toggleFavorite(writingId);
          if (!res.ok) setSaved(!next);
        });
      }}
      className="inline-flex items-center gap-2 text-sm text-muted transition hover:text-accent disabled:opacity-60"
    >
      <Heart size={16} aria-hidden fill={saved ? "currentColor" : "none"} className={saved ? "text-accent" : ""} />
      {saved ? "Saved by you" : "Keep this"}
    </button>
  );
}
