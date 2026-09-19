import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { logout } from "@/app/actions";
import { SettingsForm } from "@/components/SettingsForm";
import { getCurrentUser } from "@/lib/queries";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const me = await getCurrentUser();
  if (!me) redirect("/login");
  return (
    <div className="mx-auto max-w-lg px-5 py-12 sm:py-16">
      <h1 className="mb-12 font-serif text-4xl sm:text-5xl">Settings</h1>
      <SettingsForm profile={me} />
      <form action={logout} className="mt-14 border-t border-line pt-10">
        <button type="submit" className="btn">
          Log out
        </button>
      </form>
    </div>
  );
}
