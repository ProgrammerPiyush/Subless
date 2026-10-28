
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  UserRound,
  Palette,
  Bell,
  ShieldCheck,
  LogOut,
  Check,
  LoaderCircle,
  Moon,
  Sparkles,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "../lib/supabase/client";

type Preferences = {
  darkMode: boolean;
  renewalReminders: boolean;
  monthlySummary: boolean;
};

const DEFAULT_PREFERENCES: Preferences = {
  darkMode: true,
  renewalReminders: true,
  monthlySummary: true,
};

export default function SettingsPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">(
    "success"
  );

  const [darkMode, setDarkMode] = useState(DEFAULT_PREFERENCES.darkMode);
  const [renewalReminders, setRenewalReminders] = useState(
    DEFAULT_PREFERENCES.renewalReminders
  );
  const [monthlySummary, setMonthlySummary] = useState(
    DEFAULT_PREFERENCES.monthlySummary
  );

  const loadAccount = useCallback(async () => {
    const { data, error } = await supabase.auth.getUser();

    if (error) {
      setMessageType("error");
      setMessage("Could not load account information. Please refresh.");
    } else if (data.user) {
      setEmail(data.user.email ?? "");
    } else {
      router.replace("/login");
      return;
    }

    setLoading(false);
  }, [router, supabase]);

  useEffect(() => {
    void loadAccount();

    try {
      const saved = localStorage.getItem("subless-settings");

      if (saved) {
        const preferences = JSON.parse(saved) as Partial<Preferences>;

        if (typeof preferences.darkMode === "boolean") {
          setDarkMode(preferences.darkMode);
        }
        if (typeof preferences.renewalReminders === "boolean") {
          setRenewalReminders(preferences.renewalReminders);
        }
        if (typeof preferences.monthlySummary === "boolean") {
          setMonthlySummary(preferences.monthlySummary);
        }
      } else {
        const savedTheme = localStorage.getItem("subless-theme");
        if (savedTheme) {
          setDarkMode(savedTheme !== "light");
        }
      }
    } catch {
      setMessageType("error");
      setMessage("Could not read saved preferences from this browser.");
    }
  }, [loadAccount]);

  function savePreferences() {
    setSaving(true);
    setMessage("");

    try {
      const preferences: Preferences = {
        darkMode,
        renewalReminders,
        monthlySummary,
      };

      localStorage.setItem("subless-settings", JSON.stringify(preferences));
      localStorage.setItem("subless-theme", darkMode ? "dark" : "light");

      setMessageType("success");
      setMessage("Your preferences have been saved on this device.");
    } catch {
      setMessageType("error");
      setMessage("Could not save preferences. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function signOut() {
    setSigningOut(true);
    setMessage("");

    const { error } = await supabase.auth.signOut();

    if (error) {
      setMessageType("error");
      setMessage("Could not sign out. Please try again.");
      setSigningOut(false);
      return;
    }

    router.replace("/login");
  }

  const panel =
    "scroll-mt-6 rounded-2xl border border-white/[0.08] bg-[#171923] p-6 shadow-lg shadow-black/10 sm:p-8";

  return (
    <main className="min-h-screen bg-[#0b0c12] px-4 py-8 text-slate-100 sm:px-8 md:py-10">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-slate-400 transition hover:text-violet-300"
        >
          <ArrowLeft size={17} />
          Back to Dashboard
        </Link>

        <header className="mb-8">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-violet-300">
            Workspace / Preferences
          </p>

          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Settings<span className="text-violet-400">.</span>
          </h1>

          <p className="mt-2 text-slate-400">
            Make SubLess feel right for you.
          </p>
        </header>

        {message && (
          <div
            role="status"
            className={`mb-6 rounded-xl border p-4 text-sm ${
              messageType === "error"
                ? "border-rose-400/20 bg-rose-400/10 text-rose-200"
                : "border-emerald-400/20 bg-emerald-400/10 text-emerald-200"
            }`}
          >
            {message}
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-[220px_1fr]">
          <aside className="h-fit rounded-2xl border border-white/[0.08] bg-[#171923] p-3">
            <p className="px-3 pb-3 pt-2 text-xs font-bold uppercase tracking-wider text-slate-500">
              Preferences
            </p>

            <a
              href="#account"
              className="flex items-center gap-3 rounded-xl bg-violet-500/15 px-3 py-3 text-sm font-semibold text-violet-300 transition hover:bg-violet-500/20"
            >
              <UserRound size={18} />
              Account
            </a>

            <a
              href="#appearance"
              className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-slate-400 transition hover:bg-white/[0.04] hover:text-white"
            >
              <Palette size={18} />
              Appearance
            </a>

            <a
              href="#notifications"
              className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-slate-400 transition hover:bg-white/[0.04] hover:text-white"
            >
              <Bell size={18} />
              Notifications
            </a>

            <a
              href="#security"
              className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-slate-400 transition hover:bg-white/[0.04] hover:text-white"
            >
              <ShieldCheck size={18} />
              Security
            </a>

            <div className="mt-5 rounded-xl border border-violet-400/10 bg-gradient-to-br from-violet-500/10 to-fuchsia-500/5 p-4">
              <Sparkles size={20} className="mb-3 text-violet-300" />
              <p className="text-sm font-semibold">Your space, your way</p>
              <p className="mt-1 text-xs leading-5 text-slate-400">
                Customize your preferences whenever you need.
              </p>
            </div>
          </aside>

          <div className="space-y-6">
            <section id="account" className={panel}>
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-400/10 text-violet-300">
                  <UserRound size={21} />
                </div>

                <div>
                  <h2 className="font-bold">Account information</h2>
                  <p className="text-sm text-slate-400">
                    Your signed-in Supabase account
                  </p>
                </div>
              </div>

              <label className="mb-2 block text-sm font-medium text-slate-300">
                Email address
              </label>

              <div className="rounded-xl border border-white/10 bg-[#101119] px-4 py-3 text-sm text-slate-200">
                {loading ? "Loading account..." : email || "No email available"}
              </div>

              <p className="mt-3 text-xs text-slate-500">
                Your account email is read from Supabase authentication.
              </p>
            </section>

            <section id="appearance" className={panel}>
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-fuchsia-400/10 text-fuchsia-300">
                  <Palette size={21} />
                </div>

                <div>
                  <h2 className="font-bold">Appearance</h2>
                  <p className="text-sm text-slate-400">
                    Choose your preferred display setting
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-white/[0.05] p-3 text-slate-300">
                    <Moon size={20} />
                  </div>

                  <div>
                    <p className="font-medium">Dark mode preference</p>
                    <p className="mt-1 text-sm text-slate-400">
                      Save your theme preference on this device.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  role="switch"
                  aria-label="Dark mode preference"
                  aria-checked={darkMode}
                  onClick={() => setDarkMode((value) => !value)}
                  className={`relative h-7 w-12 shrink-0 rounded-full transition ${
                    darkMode ? "bg-violet-600" : "bg-slate-600"
                  }`}
                >
                  <span
                    className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${
                      darkMode ? "left-6" : "left-1"
                    }`}
                  />
                </button>
              </div>
            </section>

            <section id="notifications" className={panel}>
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-400/10 text-amber-300">
                  <Bell size={21} />
                </div>

                <div>
                  <h2 className="font-bold">Notifications</h2>
                  <p className="text-sm text-slate-400">
                    Choose your reminder preferences
                  </p>
                </div>
              </div>

              <div className="space-y-5">
                <PreferenceToggle
                  title="Renewal reminders"
                  description="Preference for upcoming payment reminders."
                  checked={renewalReminders}
                  onChange={setRenewalReminders}
                />

                <div className="border-t border-white/[0.07]" />

                <PreferenceToggle
                  title="Monthly spending summary"
                  description="Preference for a monthly spending overview."
                  checked={monthlySummary}
                  onChange={setMonthlySummary}
                />
              </div>

              <p className="mt-5 text-xs leading-5 text-slate-500">
                These switches save preferences locally. They do not send
                notifications or emails by themselves.
              </p>
            </section>

            <section id="security" className={panel}>
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-300">
                  <ShieldCheck size={21} />
                </div>

                <div>
                  <h2 className="font-bold">Security</h2>
                  <p className="text-sm text-slate-400">
                    Manage your current session
                  </p>
                </div>
              </div>

              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                  <p className="font-medium">Sign out of SubLess</p>
                  <p className="mt-1 text-sm text-slate-400">
                    End your current authenticated session.
                  </p>
                </div>

                <button
                  type="button"
                  disabled={signingOut}
                  onClick={() => void signOut()}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-400/20 px-4 py-3 text-sm font-semibold text-rose-300 transition hover:bg-rose-400/10 disabled:opacity-60"
                >
                  {signingOut ? (
                    <LoaderCircle size={17} className="animate-spin" />
                  ) : (
                    <LogOut size={17} />
                  )}
                  {signingOut ? "Signing out..." : "Sign out"}
                </button>
              </div>
            </section>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <button
                type="button"
                disabled={saving}
                onClick={savePreferences}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-6 py-3 font-semibold text-white shadow-lg shadow-violet-950/20 transition hover:-translate-y-0.5 hover:brightness-110 disabled:opacity-60"
              >
                {saving ? (
                  <LoaderCircle size={18} className="animate-spin" />
                ) : (
                  <Check size={18} />
                )}
                {saving ? "Saving..." : "Save preferences"}
              </button>

              <p className="text-xs text-slate-500">
                Saved preferences stay in this browser.
              </p>
            </div>
          </div>
        </div>

        <footer className="py-8 text-center text-xs text-slate-500">
          SubLess · Spend smarter.
        </footer>
      </div>
    </main>
  );
}

function PreferenceToggle({
  title,
  description,
  checked,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4">
      <div>
        <p className="font-medium">{title}</p>
        <p className="mt-1 text-sm text-slate-400">{description}</p>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={title}
        onClick={() => onChange(!checked)}
        className={`relative h-7 w-12 shrink-0 rounded-full transition ${
          checked ? "bg-violet-600" : "bg-slate-600"
        }`}
      >
        <span
          className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${
            checked ? "left-6" : "left-1"
          }`}
        />
      </button>
    </label>
  );
}
