"use client";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto max-w-xl px-5 py-24 text-center">
      <h1 className="font-serif text-4xl">That didn&rsquo;t load.</h1>
      <p className="mt-4 text-muted">
        The database didn&rsquo;t answer as expected. Check your Supabase settings and connection, then try again.
      </p>
      {error.message && <p className="mt-4 text-sm text-muted/80">{error.message}</p>}
      <button type="button" onClick={reset} className="btn mt-8">
        Try again
      </button>
    </div>
  );
}
