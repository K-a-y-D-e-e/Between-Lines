import type { Metadata } from "next";
import { LoginForm } from "@/components/LoginForm";

export const metadata: Metadata = { title: "Log in" };

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-sm px-5 py-20 sm:py-28">
      <h1 className="font-serif text-4xl">Log in</h1>
      <p className="mb-10 mt-3 font-serif italic text-muted">A private archive for two.</p>
      <LoginForm />
    </div>
  );
}
