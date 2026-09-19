import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { UUID_RE } from "@/lib/utils";
import type { Kind, Profile, Tag, Writing } from "@/types/database";

const SELECT =
  "*, author:profiles!author_id(id,display_name,username,avatar_url), writing_tags(tags(id,name))";

type Row = Omit<Writing, "tags"> & { writing_tags: { tags: Tag | null }[] | null };

function normalize(row: Row): Writing {
  const { writing_tags, ...rest } = row;
  const tags = (writing_tags ?? []).map((wt) => wt.tags).filter((t): t is Tag => t !== null);
  return { ...rest, tags };
}

export const getCurrentUser = cache(async (): Promise<Profile | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  return (data as Profile | null) ?? null;
});

export const getProfiles = cache(async (): Promise<Profile[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase.from("profiles").select("*").order("created_at");
  if (error) throw new Error(error.message);
  return (data ?? []) as Profile[];
});

export async function getProfile(id: string): Promise<Profile | null> {
  if (!UUID_RE.test(id)) return null;
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("*").eq("id", id).maybeSingle();
  return (data as Profile | null) ?? null;
}

export interface WritingFilters {
  kinds?: Kind[];
  authorId?: string;
  q?: string;
  tag?: string;
  sort?: "newest" | "oldest";
  drafts?: boolean; // RLS guarantees these are only ever the current user's
  limit?: number;
}

/**
 * Coarse filters run in the database; the text query (title, body, tags, author)
 * runs in memory. With two authors the dataset is small. To scale, replace the
 * `q` block with a tsvector column and `.textSearch()`.
 */
export async function getWritings(f: WritingFilters = {}): Promise<Writing[]> {
  const supabase = await createClient();
  let query = supabase.from("writings").select(SELECT).eq("status", f.drafts ? "draft" : "published");
  if (f.kinds?.length) query = query.in("kind", f.kinds);
  if (f.authorId) query = query.eq("author_id", f.authorId);

  const column = f.drafts ? "updated_at" : "published_at";
  const { data, error } = await query.order(column, { ascending: f.sort === "oldest" });
  if (error) throw new Error(error.message);
  let rows = ((data ?? []) as unknown as Row[]).map(normalize);

  if (f.tag) rows = rows.filter((w) => w.tags.some((t) => t.name === f.tag));
  if (f.q) {
    const needle = f.q.toLowerCase();
    rows = rows.filter((w) =>
      [w.title, w.content, w.author?.display_name ?? "", ...w.tags.map((t) => t.name)]
        .join("\n")
        .toLowerCase()
        .includes(needle),
    );
  }
  return f.limit ? rows.slice(0, f.limit) : rows;
}

export async function getWriting(id: string): Promise<Writing | null> {
  if (!UUID_RE.test(id)) return null;
  const supabase = await createClient();
  const { data, error } = await supabase.from("writings").select(SELECT).eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? normalize(data as unknown as Row) : null;
}

export async function getAllTags(): Promise<string[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("tags").select("name").order("name");
  return ((data ?? []) as { name: string }[]).map((t) => t.name);
}

export async function getFavoriteUserIds(writingId: string): Promise<string[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("favorites").select("user_id").eq("writing_id", writingId);
  return ((data ?? []) as { user_id: string }[]).map((r) => r.user_id);
}

export interface CollectionCounts {
  poem: number;
  fragment: number;
  letter: number;
}

export async function getCounts(): Promise<Record<string, CollectionCounts>> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("writings").select("author_id, kind").eq("status", "published");
  if (error) throw new Error(error.message);
  const out: Record<string, CollectionCounts> = {};
  for (const r of (data ?? []) as { author_id: string; kind: Kind }[]) {
    out[r.author_id] ??= { poem: 0, fragment: 0, letter: 0 };
    out[r.author_id][r.kind] += 1;
  }
  return out;
}
