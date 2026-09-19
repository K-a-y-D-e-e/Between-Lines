"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Kind, Status } from "@/types/database";

export interface LoginState {
  error: string | null;
}

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Enter your email and password." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: "That email and password don't match." };
  redirect("/");
}

export async function logout(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function toggleFavorite(writingId: string): Promise<{ ok: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false };

  const { data: existing } = await supabase
    .from("favorites")
    .select("writing_id")
    .eq("writing_id", writingId)
    .eq("user_id", user.id)
    .maybeSingle();

  const { error } = existing
    ? await supabase.from("favorites").delete().match({ writing_id: writingId, user_id: user.id })
    : await supabase.from("favorites").insert({ writing_id: writingId, user_id: user.id });

  if (error) return { ok: false };
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function setStatus(id: string, status: Status): Promise<{ ok: boolean }> {
  const supabase = await createClient();
  const { error } = await supabase.from("writings").update({ status }).eq("id", id);
  if (error) return { ok: false };
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function deleteWriting(id: string, kind: Kind): Promise<{ ok: boolean }> {
  const supabase = await createClient();
  const { error } = await supabase.from("writings").delete().eq("id", id);
  if (error) return { ok: false };
  revalidatePath("/", "layout");
  redirect(kind === "letter" ? "/letters" : "/poems");
}
