import { notFound } from "next/navigation";
import Link from "next/link";
import { WritingCard } from "@/components/WritingCard";
import { getCurrentUser, getProfile, getWritings } from "@/lib/queries";
import { plural } from "@/lib/utils";
import type { Kind, Writing } from "@/types/database";

export default async function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await getProfile(id);
  if (!profile) notFound();

  const me = await getCurrentUser();
  const isMe = me?.id === profile.id;
  const [published, drafts] = await Promise.all([
    getWritings({ authorId: profile.id }),
    isMe ? getWritings({ drafts: true, authorId: profile.id }) : Promise.resolve<Writing[]>([]),
  ]);
  const of = (k: Kind) => published.filter((w) => w.kind === k);
  const sections: { title: string; items: Writing[] }[] = [
    { title: "Poems", items: of("poem") },
    { title: "Fragments", items: of("fragment") },
    { title: "Letters", items: of("letter") },
  ];

  return (
    <div className="mx-auto max-w-5xl px-5 py-12 sm:px-8 sm:py-16">
      <header className="mb-14 flex items-center gap-6">
        {profile.avatar_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={profile.avatar_url} alt="" className="h-20 w-20 rounded-full object-cover" />
        )}
        <div>
          <h1 className="font-serif text-4xl sm:text-5xl">{profile.display_name}</h1>
          <p className="mt-3 text-muted">
            {plural(sections[0].items.length, "poem")} · {plural(sections[1].items.length, "fragment")} ·{" "}
            {plural(sections[2].items.length, "letter")}
          </p>
          {isMe && (
            <Link href="/settings" className="mt-3 inline-block text-sm text-muted underline underline-offset-4 hover:text-accent">
              Settings
            </Link>
          )}
        </div>
      </header>

      {isMe && drafts.length > 0 && (
        <section className="mb-14">
          <h2 className="mb-6 border-b border-line pb-3 font-serif text-2xl">Drafts</h2>
          <div className="grid gap-6 sm:grid-cols-2">
            {drafts.map((w) => (
              <Draft key={w.id} w={w} />
            ))}
          </div>
        </section>
      )}

      {published.length === 0 ? (
        <p className="font-serif italic text-muted">Nothing published yet.</p>
      ) : (
        sections
          .filter((s) => s.items.length > 0)
          .map((s) => (
            <section key={s.title} className="mb-14">
              <h2 className="mb-6 border-b border-line pb-3 font-serif text-2xl">{s.title}</h2>
              <div className="grid gap-6 sm:grid-cols-2">
                {s.items.map((w) => (
                  <WritingCard key={w.id} w={w} />
                ))}
              </div>
            </section>
          ))
      )}
    </div>
  );
}

// Drafts open in the reader (with owner controls) rather than the public route's card link.
function Draft({ w }: { w: Writing }) {
  return <WritingCard w={w} showStatus />;
}
