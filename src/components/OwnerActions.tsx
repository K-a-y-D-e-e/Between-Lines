"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { deleteWriting, setStatus } from "@/app/actions";
import type { Kind, Status } from "@/types/database";

export function OwnerActions({ id, status, kind }: { id: string; status: Status; kind: Kind }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Link href={`/write/${id}`} className="btn">
        Edit
      </Link>
      <button
        type="button"
        className="btn"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const res = await setStatus(id, status === "published" ? "draft" : "published");
            setError(res.ok ? null : "Couldn't change the status. Try again.");
          })
        }
      >
        {status === "published" ? "Unpublish" : "Publish"}
      </button>
      <button
        type="button"
        className="btn hover:!border-accent hover:!text-accent"
        disabled={pending}
        onClick={() => {
          if (!window.confirm("Delete this permanently? This can't be undone.")) return;
          start(async () => {
            const res = await deleteWriting(id, kind);
            if (res && !res.ok) setError("Couldn't delete it. Try again.");
          });
        }}
      >
        Delete
      </button>
      {error && (
        <p role="alert" className="text-sm text-accent">
          {error}
        </p>
      )}
    </div>
  );
}
