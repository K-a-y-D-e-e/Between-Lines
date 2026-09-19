"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { compressImage, extensionFor } from "@/lib/image";
import { errorMessage } from "@/lib/utils";
import type { Profile } from "@/types/database";

type Notice = { kind: "ok" | "error"; text: string } | null;

export function SettingsForm({ profile }: { profile: Profile }) {
  const router = useRouter();
  const supabase = createClient();
  const [name, setName] = useState(profile.display_name);
  const [username, setUsername] = useState(profile.username);
  const [avatar, setAvatar] = useState(profile.avatar_url);
  const [busy, setBusy] = useState(false);
  const [profileNotice, setProfileNotice] = useState<Notice>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pwNotice, setPwNotice] = useState<Notice>(null);

  const field = "mt-2 w-full border border-line bg-transparent px-3 py-3";

  async function uploadAvatar(file: File) {
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setProfileNotice({ kind: "error", text: "Use a JPG, PNG or WebP image." });
      return;
    }
    setBusy(true);
    try {
      const blob = await compressImage(file, 512);
      const path = `${profile.id}/avatar-${Date.now()}.${extensionFor(blob)}`;
      const { error } = await supabase.storage.from("media").upload(path, blob, { contentType: blob.type });
      if (error) throw error;
      setAvatar(supabase.storage.from("media").getPublicUrl(path).data.publicUrl);
      setProfileNotice(null);
    } catch (e) {
      setProfileNotice({ kind: "error", text: `Image upload failed. ${errorMessage(e)}` });
    } finally {
      setBusy(false);
    }
  }

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    const clean = username.trim().toLowerCase();
    if (!name.trim()) return setProfileNotice({ kind: "error", text: "Display name can't be empty." });
    if (!/^[a-z0-9_]{3,24}$/.test(clean))
      return setProfileNotice({ kind: "error", text: "Username: 3 to 24 letters, numbers or underscores." });
    setBusy(true);
    const { error } = await supabase
      .from("profiles")
      .update({ display_name: name.trim(), username: clean, avatar_url: avatar })
      .eq("id", profile.id);
    setBusy(false);
    if (error) {
      setProfileNotice({ kind: "error", text: error.code === "23505" ? "That username is taken." : error.message });
      return;
    }
    setUsername(clean);
    setProfileNotice({ kind: "ok", text: "Saved." });
    router.refresh();
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) return setPwNotice({ kind: "error", text: "Use at least 8 characters." });
    if (password !== confirm) return setPwNotice({ kind: "error", text: "The two passwords don't match." });
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) return setPwNotice({ kind: "error", text: error.message });
    setPassword("");
    setConfirm("");
    setPwNotice({ kind: "ok", text: "Password changed." });
  }

  const note = (n: Notice) =>
    n && (
      <p role={n.kind === "error" ? "alert" : "status"} className={`text-sm ${n.kind === "error" ? "text-accent" : "text-muted"}`}>
        {n.text}
      </p>
    );

  return (
    <div className="space-y-14">
      <form onSubmit={saveProfile} className="space-y-6">
        <h2 className="font-serif text-2xl">Profile</h2>
        <div className="flex items-center gap-5">
          {avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatar} alt="Your avatar" className="h-20 w-20 rounded-full object-cover" />
          ) : (
            <div aria-hidden className="grid h-20 w-20 place-items-center rounded-full border border-line font-serif text-2xl text-muted">
              {name.charAt(0).toUpperCase()}
            </div>
          )}
          <label className="btn cursor-pointer focus-within:outline focus-within:outline-2 focus-within:outline-accent">
            Change avatar
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void uploadAvatar(f);
                e.target.value = "";
              }}
            />
          </label>
        </div>
        <div>
          <label htmlFor="display" className="label">
            Display name
          </label>
          <input id="display" value={name} onChange={(e) => setName(e.target.value)} className={field} maxLength={60} />
        </div>
        <div>
          <label htmlFor="username" className="label">
            Username
          </label>
          <input id="username" value={username} onChange={(e) => setUsername(e.target.value)} className={field} />
        </div>
        {note(profileNotice)}
        <button type="submit" disabled={busy} className="btn btn-solid disabled:opacity-60">
          Save profile
        </button>
      </form>

      <form onSubmit={changePassword} className="space-y-6 border-t border-line pt-10">
        <h2 className="font-serif text-2xl">Password</h2>
        <div>
          <label htmlFor="pw" className="label">
            New password
          </label>
          <input id="pw" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} className={field} />
        </div>
        <div>
          <label htmlFor="pw2" className="label">
            Confirm password
          </label>
          <input id="pw2" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className={field} />
        </div>
        {note(pwNotice)}
        <button type="submit" disabled={busy} className="btn disabled:opacity-60">
          Change password
        </button>
      </form>
    </div>
  );
}
