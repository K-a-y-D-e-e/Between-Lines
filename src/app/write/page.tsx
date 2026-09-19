import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Editor } from "@/components/Editor";
import { getAllTags, getCurrentUser } from "@/lib/queries";
import type { Kind } from "@/types/database";

export const metadata: Metadata = { title: "Write" };

export default async function WritePage({ searchParams }: { searchParams: Promise<{ kind?: string }> }) {
  const [{ kind }, me, tags] = await Promise.all([searchParams, getCurrentUser(), getAllTags()]);
  if (!me) redirect("/login");
  const defaultKind: Kind = kind === "letter" || kind === "fragment" ? kind : "poem";
  return <Editor userId={me.id} defaultKind={defaultKind} suggestions={tags} />;
}
