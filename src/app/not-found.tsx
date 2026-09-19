import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-5 py-24 text-center">
      <h1 className="font-serif text-5xl">Nothing here.</h1>
      <p className="mt-4 font-serif italic text-muted">This page doesn&rsquo;t exist, or it isn&rsquo;t yours to see.</p>
      <Link href="/poems" className="btn mt-8 inline-block">
        Back to the archive
      </Link>
    </div>
  );
}
