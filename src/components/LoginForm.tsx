"use client";

import { useActionState } from "react";
import { login, type LoginState } from "@/app/actions";

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, { error: null });
  const field = "mt-2 w-full border border-line bg-transparent px-3 py-3";

  return (
    <form action={action} className="space-y-6">
      <div>
        <label htmlFor="email" className="label">
          Email
        </label>
        <input id="email" name="email" type="email" autoComplete="email" required className={field} />
      </div>
      <div>
        <label htmlFor="password" className="label">
          Password
        </label>
        <input id="password" name="password" type="password" autoComplete="current-password" required className={field} />
      </div>
      {state.error && (
        <p role="alert" className="text-sm text-accent">
          {state.error}
        </p>
      )}
      <button type="submit" disabled={pending} className="btn btn-solid w-full py-3 disabled:opacity-60">
        {pending ? "Signing in…" : "Log in"}
      </button>
    </form>
  );
}
