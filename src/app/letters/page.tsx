import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/components/EmptyState";
import { getWritings } from "@/lib/queries";
import { excerpt, formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Letters" };

export default async function LettersPage() {
  const letters = await getWritings({ kinds: ["letter"] });

  return (
    <div className="mx-auto max-w-2xl px-5 py-12 sm:py-16">
      <h1 className="font-serif text-4xl sm:text-5xl">Letters</h1>
      <p className="mb-12 mt-3 font-serif italic text-muted">Longer things, written to someone.</p>
      {letters.length === 0 ? (
        <EmptyState title="No letters yet." note="Some things need more room." href="/write?kind=letter" action="Write a letter" />
      ) : (
        <ul className="divide-y divide-line border-y border-line">
          {letters.map((l) => (
            <li key={l.id}>
              <Link href={`/letters/${l.id}`} className="group block py-8 transition hover:pl-2">
                <p className="label">
                  {l.recipient ? `To ${l.recipient} · ` : ""}From {l.author?.display_name} · {formatDate(l.published_at, "short")}
                </p>
                <h2 className="mt-2 font-serif text-2xl group-hover:text-accent">{l.title || "Untitled"}</h2>
                <p className="mt-3 whitespace-pre-line font-serif text-ink/75">{excerpt(l.content, 2)}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
