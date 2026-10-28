
"use client";

import { FormEvent, useState } from "react";
import { createClient } from "../lib/supabase/client";

export default function LoginPage() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function signIn(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    window.location.href = "/";
  }

  async function signUp() {
    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    setLoading(false);

    setMessage(
      error
        ? error.message
        : "Account created. Check your email if confirmation is required, then sign in."
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
      <form
        onSubmit={signIn}
        className="w-full max-w-md space-y-5 rounded-2xl bg-white p-8 shadow"
      >
        <div>
          <h1 className="text-3xl font-bold text-slate-900">SubLess</h1>
          <p className="mt-2 text-slate-500">
            Sign in to manage your subscriptions.
          </p>
        </div>

        <label className="block text-sm font-medium">
          Email
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-xl border p-3"
            placeholder="you@example.com"
          />
        </label>

        <label className="block text-sm font-medium">
          Password
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-xl border p-3"
            placeholder="At least 6 characters"
          />
        </label>

        <button
          disabled={loading}
          className="w-full rounded-xl bg-indigo-600 p-3 font-semibold text-white disabled:opacity-50"
        >
          {loading ? "Please wait..." : "Sign in"}
        </button>

        <button
          type="button"
          disabled={loading}
          onClick={signUp}
          className="w-full rounded-xl border border-slate-300 p-3 font-semibold text-slate-700 disabled:opacity-50"
        >
          Create account
        </button>

        {message && (
          <p role="status" className="break-words text-sm text-slate-600">
            {message}
          </p>
        )}
      </form>
    </main>
  );
}
