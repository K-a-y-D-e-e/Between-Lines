import Link from "next/link";

export function EmptyState({ title, note, href, action }: { title: string; note: string; href?: string; action?: string }) {
  return (
    <div className="border border-dashed border-line px-6 py-16 text-center">
      <p className="font-serif text-2xl">{title}</p>
      <p className="mt-2 font-serif italic text-muted">{note}</p>
      {href && action && (
        <Link href={href} className="btn mt-6 inline-block">
          {action}
        </Link>
      )}
    </div>
  );
}
