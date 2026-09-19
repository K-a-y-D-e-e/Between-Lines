"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  tags: string[];
  otherName: string;
}

const KINDS = [
  { value: "", label: "All" },
  { value: "poem", label: "Poems" },
  { value: "fragment", label: "Fragments" },
];

export function Filters({ tags, otherName }: Props) {
  const router = useRouter();
  const sp = useSearchParams();
  const [q, setQ] = useState(sp.get("q") ?? "");

  function update(key: string, value: string) {
    const next = new URLSearchParams(sp.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    const qs = next.toString();
    router.push(qs ? `/poems?${qs}` : "/poems");
  }

  const kind = sp.get("kind") ?? "";
  const field = "border border-line bg-transparent px-3 py-2 text-sm";

  return (
    <div className="space-y-5">
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          update("q", q.trim());
        }}
        className="relative"
      >
        <Search size={16} aria-hidden className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search titles, lines, tags, authors"
          aria-label="Search"
          className={cn(field, "w-full py-3 pl-9")}
        />
      </form>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex gap-5 text-sm" role="group" aria-label="Type">
          {KINDS.map((k) => (
            <button
              key={k.value}
              type="button"
              aria-pressed={kind === k.value}
              onClick={() => update("kind", k.value)}
              className={cn("pb-1", kind === k.value ? "border-b border-ink" : "text-muted hover:text-accent")}
            >
              {k.label}
            </button>
          ))}
          <Link href="/letters" className="pb-1 text-muted hover:text-accent">
            Letters
          </Link>
        </div>

        <div className="flex flex-wrap gap-3">
          <select aria-label="Author" className={field} value={sp.get("who") ?? ""} onChange={(e) => update("who", e.target.value)}>
            <option value="">All poems</option>
            <option value="me">My poems</option>
            <option value="other">{otherName}&rsquo;s poems</option>
          </select>
          <select aria-label="Tag" className={field} value={sp.get("tag") ?? ""} onChange={(e) => update("tag", e.target.value)}>
            <option value="">Any tag</option>
            {tags.map((t) => (
              <option key={t} value={t}>
                #{t}
              </option>
            ))}
          </select>
          <select aria-label="Sort" className={field} value={sp.get("sort") ?? "newest"} onChange={(e) => update("sort", e.target.value === "newest" ? "" : e.target.value)}>
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
          </select>
        </div>
      </div>
    </div>
  );
}
