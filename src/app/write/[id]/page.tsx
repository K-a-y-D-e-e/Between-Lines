import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Editor } from "@/components/Editor";
import { getAllTags, getCurrentUser, getWriting } from "@/lib/queries";

export const metadata: Metadata = { title: "Edit" };

export default async function EditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [me, w, tags] = await Promise.all([getCurrentUser(), getWriting(id), getAllTags()]);
  if (!me) redirect("/login");
  if (!w || w.author_id !== me.id) notFound(); // RLS also blocks writes to other people's pieces
  return <Editor userId={me.id} initial={w} defaultKind={w.kind} suggestions={tags} />;
}
