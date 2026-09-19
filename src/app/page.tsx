import Link from "next/link";
import { EmptyState } from "@/components/EmptyState";
import { WritingCard } from "@/components/WritingCard";
import { getCounts, getCurrentUser, getProfiles, getWritings } from "@/lib/queries";
import { plural } from "@/lib/utils";

export default async function HomePage() {
  const [me, profiles, recent, counts] = await Promise.all([
    getCurrentUser(),
    getProfiles(),
    getWritings({ limit: 4 }),
    getCounts(),
  ]);
  const ordered = [...profiles].sort((a, b) => (a.id === me?.id ? -1 : b.id === me?.id ? 1 : 0));

  return (
    <div className="mx-auto max-w-5xl px-5 sm:px-8">
      <section className="py-20 text-center sm:py-28">
        <h1 className="font-serif text-5xl tracking-[0.18em] sm:text-7xl">BETWEEN LINES</h1>
        <p className="mt-6 font-serif text-xl italic text-muted">poems, fragments, and things worth keeping.</p>
      </section>

      <section aria-labelledby="recent">
        <div className="mb-8 flex items-baseline justify-between border-b border-line pb-3">
          <h2 id="recent" className="font-serif text-2xl">
            Recently written
          </h2>
          <Link href="/poems" className="text-sm text-muted hover:text-accent">
            Whole archive
          </Link>
        </div>
        {recent.length === 0 ? (
          <EmptyState title="No poems yet." note="Maybe the first one should be yours." href="/write" action="Write something" />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2">
            {recent.map((w) => (
              <WritingCard key={w.id} w={w} />
            ))}
          </div>
        )}
      </section>

      <section aria-label="Collections" className="mt-20 grid gap-8 border-t border-line py-12 sm:grid-cols-2">
        {ordered.map((p) => {
          const c = counts[p.id] ?? { poem: 0, fragment: 0, letter: 0 };
          return (
            <Link key={p.id} href={`/profile/${p.id}`} className="group block">
              <p className="label">{p.id === me?.id ? "Your collection" : `${p.display_name}’s collection`}</p>
              <p className="mt-2 font-serif text-4xl group-hover:text-accent">{plural(c.poem, "poem")}</p>
              <p className="mt-1 text-sm text-muted">
                {plural(c.fragment, "fragment")} · {plural(c.letter, "letter")}
              </p>
            </Link>
          );
        })}
      </section>
    </div>
  );
}
