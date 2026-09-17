"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { HOUSEHOLD_USERS, supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

export function LoginScreen() {
  const [who, setWho] = useState<(typeof HOUSEHOLD_USERS)[number]>(HOUSEHOLD_USERS[0]);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signIn(event: React.FormEvent) {
    event.preventDefault();
    if (!password || busy) return;
    setBusy(true);
    setError(null);
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: who.email,
      password,
    });
    if (signInError) {
      setError(
        signInError.message === "Invalid login credentials"
          ? "That password isn't right. Try again."
          : signInError.message,
      );
      setBusy(false);
    }
    // On success the auth listener swaps this screen for the app.
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="card w-full max-w-sm p-8">
        <div className="mb-6 flex flex-col items-center text-center">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-teal text-white">
            <Sparkles className="h-5 w-5" />
          </span>
          <h1 className="mt-4 font-[family-name:var(--font-display)] text-3xl">Genie</h1>
          <p className="mt-1 text-sm text-muted">The household books. Members only.</p>
        </div>

        <form onSubmit={signIn}>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted">Who&apos;s this?</p>
          <div className="grid grid-cols-2 gap-2">
            {HOUSEHOLD_USERS.map((member) => (
              <button
                key={member.email}
                type="button"
                onClick={() => setWho(member)}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-2xl border px-3 py-4 transition",
                  who.email === member.email
                    ? "border-teal bg-teal-soft text-teal-dark"
                    : "border-line bg-card text-muted hover:bg-paper-2",
                )}
              >
                <span
                  className={cn(
                    "grid h-10 w-10 place-items-center rounded-full text-lg font-bold",
                    who.email === member.email ? "bg-teal text-white" : "bg-paper-2 text-muted",
                  )}
                >
                  {member.name[0]}
                </span>
                <span className="text-sm font-semibold">{member.name}</span>
              </button>
            ))}
          </div>

          <label className="mt-5 block text-xs font-semibold uppercase tracking-[0.16em] text-muted">
            Password
          </label>
          <input
            type="password"
            autoComplete="current-password"
            className="field mt-2"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="••••"
            autoFocus
          />

          {error ? <p className="mt-3 text-sm text-rose">{error}</p> : null}

          <button
            type="submit"
            disabled={!password || busy}
            className="mt-5 w-full rounded-full bg-teal px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-dark disabled:opacity-50"
          >
            {busy ? "Opening the books…" : `Sign in as ${who.name}`}
          </button>
        </form>

        <p className="mt-6 text-center text-xs leading-5 text-muted">
          Your money data lives in the household database and is only visible after signing in.
        </p>
      </div>
    </div>
  );
}