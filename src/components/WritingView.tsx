import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { FavoriteButton } from "@/components/FavoriteButton";
import { OwnerActions } from "@/components/OwnerActions";
import { Tag } from "@/components/Tag";
import { getCurrentUser, getFavoriteUserIds, getProfiles, getWriting } from "@/lib/queries";
import { formatDate } from "@/lib/utils";

export async function WritingView({ id, section }: { id: string; section: "poems" | "letters" }) {
  const w = await getWriting(id);
  if (!w) notFound();

  const expected = w.kind === "letter" ? "letters" : "poems";
  if (expected !== section) redirect(`/${expected}/${w.id}`);

  const [me, profiles, favoriteIds] = await Promise.all([getCurrentUser(), getProfiles(), getFavoriteUserIds(w.id)]);
  const isOwner = me?.id === w.author_id;
  const savedByMe = !!me && favoriteIds.includes(me.id);
  const savedByOther = favoriteIds
    .filter((uid) => uid !== me?.id)
    .map((uid) => profiles.find((p) => p.id === uid)?.display_name)
    .filter(Boolean);
  const isLetter = w.kind === "letter";

  return (
    <article className="mx-auto max-w-2xl px-5 py-12 sm:py-20">
      <Link href={`/${section}`} className="label hover:text-accent">
        ← Back to {isLetter ? "letters" : "archive"}
      </Link>

      {w.status === "draft" && (
        <p className="mt-8 border border-line px-4 py-3 text-sm text-muted">Draft. Only you can see this.</p>
      )}

      <header className="mt-12 text-center sm:mt-16">
        {w.title && <h1 className="font-serif text-4xl leading-tight sm:text-5xl">{w.title}</h1>}
        <p className="label mt-5">
          <Link href={`/profile/${w.author_id}`} className="hover:text-accent">
            {w.author?.display_name}
          </Link>{" "}
          · {formatDate(w.published_at ?? w.created_at)}
        </p>
      </header>

      {w.cover_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={w.cover_url} alt="" className="mx-auto mt-12 max-h-96 w-full max-w-md object-cover" />
      )}

      <div className={`mx-auto mt-14 ${isLetter ? "max-w-[38rem]" : "max-w-[34rem]"}`}>
        {isLetter && w.recipient && <p className="mb-6 font-serif italic text-muted">To {w.recipient}</p>}
        <div className={isLetter ? "poem !leading-[1.85]" : "poem"}>{w.content}</div>
      </div>

      {w.tags.length > 0 && (
        <div className="mx-auto mt-14 flex max-w-[34rem] flex-wrap gap-x-4 gap-y-1">
          {w.tags.map((t) => (
            <Tag key={t.id} name={t.name} href={`/poems?tag=${encodeURIComponent(t.name)}`} />
          ))}
        </div>
      )}

      <footer className="mx-auto mt-10 max-w-[34rem] space-y-6 border-t border-line pt-6">
        {!isOwner && w.status === "published" && <FavoriteButton writingId={w.id} initial={savedByMe} />}
        {isOwner && savedByOther.length > 0 && (
          <p className="text-sm text-muted">Saved by {savedByOther.join(", ")}</p>
        )}
        {isOwner && <OwnerActions id={w.id} status={w.status} kind={w.kind} />}
      </footer>
    </article>
  );
}
