"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ImagePlus, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { compressImage, extensionFor } from "@/lib/image";
import { cn, errorMessage } from "@/lib/utils";
import type { Kind, Status, Writing } from "@/types/database";

interface Props {
  userId: string;
  initial?: Writing;
  defaultKind: Kind;
  suggestions: string[];
}

const KINDS: { value: Kind; label: string }[] = [
  { value: "poem", label: "Poem" },
  { value: "fragment", label: "Fragment" },
  { value: "letter", label: "Letter" },
];

export function Editor({ userId, initial, defaultKind, suggestions }: Props) {
  const router = useRouter();
  const supabase = useRef(createClient()).current;
  const idRef = useRef<string | null>(initial?.id ?? null);
  const savingRef = useRef(false);
  const areaRef = useRef<HTMLTextAreaElement>(null);

  const [kind, setKind] = useState<Kind>(initial?.kind ?? defaultKind);
  const [title, setTitle] = useState(initial?.title ?? "");
  const [content, setContent] = useState(initial?.content ?? "");
  const [recipient, setRecipient] = useState(initial?.recipient ?? "");
  const [tags, setTags] = useState<string[]>(initial?.tags.map((t) => t.name) ?? []);
  const [tagInput, setTagInput] = useState("");
  const [cover, setCover] = useState<string | null>(initial?.cover_url ?? null);
  const [status, setStatus] = useState<Status>(initial?.status ?? "draft");
  const [preview, setPreview] = useState(false);
  const [touched, setTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Grow the textarea with its content.
  useEffect(() => {
    const el = areaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.max(el.scrollHeight, 280)}px`;
  }, [content, preview]);

  useEffect(() => {
    if (!touched) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [touched]);

  const syncTags = useCallback(
    async (writingId: string) => {
      await supabase.from("writing_tags").delete().eq("writing_id", writingId);
      if (tags.length === 0) return;
      const up = await supabase.from("tags").upsert(tags.map((name) => ({ name })), { onConflict: "name", ignoreDuplicates: true });
      if (up.error) throw up.error;
      const { data, error: selErr } = await supabase.from("tags").select("id").in("name", tags);
      if (selErr) throw selErr;
      const rows = ((data ?? []) as { id: string }[]).map((t) => ({ writing_id: writingId, tag_id: t.id }));
      if (rows.length) {
        const ins = await supabase.from("writing_tags").insert(rows);
        if (ins.error) throw ins.error;
      }
    },
    [supabase, tags],
  );

  const save = useCallback(
    async (next: Status): Promise<string | null> => {
      if (savingRef.current) return idRef.current;
      if (next === "published" && !content.trim()) {
        setError("Write something before publishing.");
        return null;
      }
      savingRef.current = true;
      setSaving(true);
      setError(null);
      try {
        const payload = {
          kind,
          title: title.trim(),
          content,
          recipient: kind === "letter" ? recipient.trim() || null : null,
          cover_url: cover,
          status: next,
        };
        let id = idRef.current;
        if (id) {
          const { error: e } = await supabase.from("writings").update(payload).eq("id", id);
          if (e) throw e;
        } else {
          const { data, error: e } = await supabase
            .from("writings")
            .insert({ ...payload, author_id: userId })
            .select("id")
            .single();
          if (e) throw e;
          id = (data as { id: string }).id;
          idRef.current = id;
          window.history.replaceState(null, "", `/write/${id}`);
        }
        await syncTags(id);
        setStatus(next);
        setSavedAt(new Date());
        setTouched(false);
        return id;
      } catch (e) {
        setError(`Couldn't save. ${errorMessage(e, "Check your connection and try again.")}`);
        return null;
      } finally {
        savingRef.current = false;
        setSaving(false);
      }
    },
    [content, cover, kind, recipient, supabase, syncTags, title, userId],
  );

  // Autosave drafts only; a published piece changes only when you say so.
  useEffect(() => {
    if (!touched || status === "published" || (!title.trim() && !content.trim())) return;
    const t = setTimeout(() => void save("draft"), 2500);
    return () => clearTimeout(t);
  }, [touched, status, title, content, tags, recipient, kind, cover, save]);

  async function publish() {
    const id = await save("published");
    if (id) {
      router.push(`/${kind === "letter" ? "letters" : "poems"}/${id}`);
      router.refresh();
    }
  }

  async function onFile(file: File) {
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Use a JPG, PNG or WebP image.");
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const blob = await compressImage(file, 1600);
      const path = `${userId}/${crypto.randomUUID()}.${extensionFor(blob)}`;
      const { error: e } = await supabase.storage.from("media").upload(path, blob, { contentType: blob.type });
      if (e) throw e;
      setCover(supabase.storage.from("media").getPublicUrl(path).data.publicUrl);
      setTouched(true);
    } catch (e) {
      setError(`Image upload failed. ${errorMessage(e)}`);
    } finally {
      setUploading(false);
    }
  }

  function addTag(raw: string) {
    const name = raw.trim().toLowerCase().replace(/^#/, "").replace(/\s+/g, "-").slice(0, 40);
    if (name && !tags.includes(name) && tags.length < 12) {
      setTags([...tags, name]);
      setTouched(true);
    }
    setTagInput("");
  }

  const dirty = <T,>(set: (v: T) => void) => (v: T) => {
    set(v);
    setTouched(true);
  };

  const statusLine = saving
    ? "Saving…"
    : savedAt
      ? `${status === "published" ? "Published" : "Draft"} · saved ${savedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
      : status === "published"
        ? "Published"
        : "Not saved yet";

  return (
    <div className="mx-auto max-w-2xl px-5 pb-40 pt-10 sm:pt-16">
      <div className="mb-10 flex items-center justify-between gap-4">
        <div className="flex gap-5 text-sm" role="group" aria-label="Kind of writing">
          {KINDS.map((k) => (
            <button
              key={k.value}
              type="button"
              aria-pressed={kind === k.value}
              onClick={() => dirty(setKind)(k.value)}
              className={cn("pb-1", kind === k.value ? "border-b border-ink" : "text-muted hover:text-accent")}
            >
              {k.label}
            </button>
          ))}
        </div>
        <p className="label normal-case tracking-normal" aria-live="polite">
          {statusLine}
        </p>
      </div>

      <AnimatePresence mode="wait">
        {preview ? (
          <motion.div key="preview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-h-[50vh]">
            {title && <h1 className="mb-10 text-center font-serif text-4xl sm:text-5xl">{title}</h1>}
            {kind === "letter" && recipient && <p className="mb-6 font-serif italic text-muted">To {recipient}</p>}
            <div className="poem mx-auto max-w-[34rem]">{content || "Nothing written yet."}</div>
          </motion.div>
        ) : (
          <motion.div key="write" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <input
              value={title}
              onChange={(e) => dirty(setTitle)(e.target.value)}
              placeholder={kind === "fragment" ? "Title (optional)" : "Untitled"}
              aria-label="Title"
              maxLength={160}
              className="w-full bg-transparent font-serif text-4xl placeholder:text-line focus:outline-none sm:text-5xl"
            />
            {kind === "letter" && (
              <input
                value={recipient}
                onChange={(e) => dirty(setRecipient)(e.target.value)}
                placeholder="To…"
                aria-label="Recipient"
                className="mt-4 w-full bg-transparent font-serif text-xl italic placeholder:text-line focus:outline-none"
              />
            )}
            <textarea
              ref={areaRef}
              value={content}
              onChange={(e) => dirty(setContent)(e.target.value)}
              placeholder={kind === "fragment" ? "A line, a moment." : "Begin anywhere."}
              aria-label="Body"
              spellCheck
              className="poem mt-8 block w-full resize-none bg-transparent placeholder:text-line focus:outline-none"
            />
          </motion.div>
        )}
      </AnimatePresence>

      <section className="mt-12 space-y-8 border-t border-line pt-8">
        <div>
          <label htmlFor="tag-input" className="label">
            Tags
          </label>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {tags.map((t) => (
              <span key={t} className="inline-flex items-center gap-1 border border-line px-2 py-1 text-sm text-muted">
                #{t}
                <button type="button" aria-label={`Remove tag ${t}`} onClick={() => dirty(setTags)(tags.filter((x) => x !== t))}>
                  <X size={12} />
                </button>
              </span>
            ))}
            <input
              id="tag-input"
              list="tag-suggestions"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === ",") {
                  e.preventDefault();
                  addTag(tagInput);
                } else if (e.key === "Backspace" && !tagInput && tags.length) {
                  dirty(setTags)(tags.slice(0, -1));
                }
              }}
              onBlur={() => tagInput && addTag(tagInput)}
              placeholder="Add a tag, press Enter"
              className="min-w-40 flex-1 bg-transparent py-1 text-sm focus:outline-none"
            />
            <datalist id="tag-suggestions">
              {suggestions.filter((s) => !tags.includes(s)).map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </div>
        </div>

        <div>
          <p className="label">Cover image</p>
          {cover ? (
            <div className="mt-3 flex items-start gap-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={cover} alt="Cover preview" className="h-28 w-28 object-cover" />
              <button type="button" className="text-sm text-muted underline underline-offset-4 hover:text-accent" onClick={() => dirty(setCover)(null)}>
                Remove
              </button>
            </div>
          ) : (
            <label className="btn mt-3 inline-flex cursor-pointer items-center gap-2 focus-within:outline focus-within:outline-2 focus-within:outline-accent">
              <ImagePlus size={16} aria-hidden />
              {uploading ? "Uploading…" : "Add an image"}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                disabled={uploading}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void onFile(f);
                  e.target.value = "";
                }}
              />
            </label>
          )}
        </div>

        {error && (
          <p role="alert" className="border border-accent/40 px-4 py-3 text-sm text-accent">
            {error}
          </p>
        )}
      </section>

      <div className="fixed inset-x-0 bottom-0 border-t border-line bg-paper/95 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-5 py-3">
          <button type="button" className="btn" aria-pressed={preview} onClick={() => setPreview((v) => !v)}>
            {preview ? "Keep writing" : "Preview"}
          </button>
          <div className="flex gap-3">
            {status === "published" ? (
              <>
                <button type="button" className="btn" disabled={saving} onClick={() => void save("draft")}>
                  Move to drafts
                </button>
                <button type="button" className="btn btn-solid" disabled={saving} onClick={() => void save("published")}>
                  Save changes
                </button>
              </>
            ) : (
              <>
                <button type="button" className="btn" disabled={saving} onClick={() => void save("draft")}>
                  Save draft
                </button>
                <button type="button" className="btn btn-solid" disabled={saving} onClick={() => void publish()}>
                  Publish
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
