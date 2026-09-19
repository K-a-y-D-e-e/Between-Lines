import type { Metadata } from "next";
import { Suspense } from "react";
import { EmptyState } from "@/components/EmptyState";
import { Filters } from "@/components/Filters";
import { WritingCard } from "@/components/WritingCard";
import { getAllTags, getCurrentUser, getProfiles, getWritings } from "@/lib/queries";
import type { Kind } from "@/types/database";

export const metadata: Metadata = { title: "Poems" };

type Params = Promise<Record<string, string | string[] | undefined>>;

export default async function PoemsPage({ searchParams }: { searchParams: Params }) {
  const raw = await searchParams;
  const one = (k: string) => (Array.isArray(raw[k]) ? raw[k]![0] : (raw[k] as string | undefined)) || undefined;

  const [me, profiles, tags] = await Promise.all([getCurrentUser(), getProfiles(), getAllTags()]);
  const other = profiles.find((p) => p.id !== me?.id);
  const who = one("who");
  const authorId = who === "me" ? me?.id : who === "other" ? other?.id : undefined;
  const kind = one("kind");
  const kinds: Kind[] = kind === "poem" || kind === "fragment" ? [kind] : ["poem", "fragment"];

  const writings = await getWritings({
    kinds,
    authorId,
    q: one("q"),
    tag: one("tag"),
    sort: one("sort") === "oldest" ? "oldest" : "newest",
  });
  const filtered = Boolean(one("q") || one("tag") || who || kind);

  return (
    <div className="mx-auto max-w-5xl px-5 py-12 sm:px-8 sm:py-16">
      <h1 className="mb-10 font-serif text-4xl sm:text-5xl">The archive</h1>
      <Suspense fallback={null}>
        <Filters tags={tags} otherName={other?.display_name ?? "Her"} />
      </Suspense>
      <div className="mt-10">
        {writings.length === 0 ? (
          filtered ? (
            <EmptyState title="Nothing matches." note="Try fewer words, or clear a filter." />
          ) : (
            <EmptyState title="No poems yet." note="Maybe the first one should be yours." href="/write" action="Write something" />
          )
        ) : (
          <div className="grid gap-6 sm:grid-cols-2">
            {writings.map((w) => (
              <WritingCard key={w.id} w={w} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
