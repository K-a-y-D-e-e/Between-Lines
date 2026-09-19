import Link from "next/link";
import { Tag } from "@/components/Tag";
import { excerpt, formatDate } from "@/lib/utils";
import type { Writing } from "@/types/database";

export function WritingCard({ w, showStatus = false }: { w: Writing; showStatus?: boolean }) {
  const href = `${w.kind === "letter" ? "/letters" : "/poems"}/${w.id}`;
  const body = w.kind === "fragment" ? w.content : excerpt(w.content, w.kind === "letter" ? 3 : 4);
  const label = w.title || (w.kind === "fragment" ? "" : "Untitled");

  return (
    <article className="relative border border-line p-6 transition duration-300 hover:-translate-y-0.5 hover:border-ink/40 focus-within:border-ink/40 sm:p-7">
      {label && (
        <h3 className="font-serif text-2xl leading-snug">
          <Link href={href} className="after:absolute after:inset-0">
            {label}
          </Link>
        </h3>
      )}
      <p className="label mt-2">
        {w.kind === "letter" && w.recipient ? `To ${w.recipient} · ` : ""}
        {w.author?.display_name} · {formatDate(w.published_at ?? w.updated_at, "short")}
        {showStatus && w.status === "draft" ? " · Draft" : ""}
      </p>
      <p className="poem mt-5 !text-[1.05rem] !leading-[1.8] text-ink/85">
        {!label && <Link href={href} className="after:absolute after:inset-0" aria-label="Read fragment" />}
        {body}
      </p>
      {w.tags.length > 0 && (
        <div className="mt-5 flex flex-wrap gap-x-3 gap-y-1">
          {w.tags.map((t) => (
            <Tag key={t.id} name={t.name} />
          ))}
        </div>
      )}
    </article>
  );
}
