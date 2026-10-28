"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { createClient } from "./lib/supabase/client";
import {
  Bell,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  CreditCard,
  LayoutDashboard,
  LogOut,
  LoaderCircle,
  Moon,
  Plus,
  Search,
  Settings,
  Sparkles,
  Sun,
  Trash2,
  TrendingDown,
  X,
} from "lucide-react";

type Subscription = {
  id: string;
  name: string;
  category: string;
  amount: number;
  interval: "Monthly" | "Yearly";
  renewal: string;
  usage: number;
  color: string;
};

const money = (amount: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);

const colors: Record<string, string> = {
  Entertainment: "#E50914",
  Music: "#1DB954",
  "AI & Tools": "#10A37F",
  Design: "#7C5CFC",
  Fitness: "#0D9488",
  Utilities: "#D97706",
  Other: "#64748b",
};

export default function Home() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [darkMode, setDarkMode] = useState(true);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Entertainment");
  const [amount, setAmount] = useState("");
  const [interval, setInterval] = useState<"Monthly" | "Yearly">("Monthly");
  const [renewal, setRenewal] = useState("");

  const loadSubscriptions = useCallback(async () => {
    setLoading(true);

    const { data: userData, error: userError } =
      await supabase.auth.getUser();

    if (userError || !userData.user) {
      window.location.href = "/login";
      return;
    }

    const { data, error } = await supabase
      .from("subscriptions")
      .select("*")
      .order("next_renewal", { ascending: true });

    if (error) {
      setMessage(`Couldn't load subscriptions: ${error.message}`);
      setLoading(false);
      return;
    }

    setSubscriptions(
      (data ?? []).map((item) => ({
        id: String(item.id),
        name: item.name,
        category: item.category ?? "Other",
        amount: Number(item.amount),
        interval:
          item.billing_interval === "yearly" ? "Yearly" : "Monthly",
        renewal: item.next_renewal,
        usage: Number(item.usage_per_month ?? 0),
        color: colors[item.category] ?? "#64748b",
      }))
    );

    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    void loadSubscriptions();
  }, [loadSubscriptions]);

  useEffect(() => {
    const savedTheme = localStorage.getItem("subless-theme");
    const enabled = savedTheme !== "light";

    setDarkMode(enabled);
    document.documentElement.classList.toggle("dark", enabled);
  }, []);

  function toggleTheme() {
    const next = !darkMode;

    setDarkMode(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("subless-theme", next ? "dark" : "light");
  }

  const monthlySpend = subscriptions.reduce(
    (sum, sub) =>
      sum + (sub.interval === "Monthly" ? sub.amount : sub.amount / 12),
    0
  );

  const upcoming = useMemo(
    () =>
      [...subscriptions]
        .sort(
          (a, b) =>
            new Date(a.renewal).getTime() -
            new Date(b.renewal).getTime()
        )
        .slice(0, 3),
    [subscriptions]
  );

  const lowUsage = useMemo(
    () => subscriptions.filter((sub) => sub.usage < 5),
    [subscriptions]
  );

  const filtered = useMemo(
    () =>
      subscriptions.filter((sub) =>
        sub.name.toLowerCase().includes(search.toLowerCase())
      ),
    [subscriptions, search]
  );

  function goTo(section: string) {
    if (section === "dashboard") router.push("/");
    else if (section === "subscriptions") router.push("/subscriptions");
    else if (section === "renewals") router.push("/renewals");
    else if (section === "optimizer") router.push("/optimizer");
    else if (section === "settings") router.push("/settings");
  }

  async function deleteSubscription(id: string, serviceName: string) {
    if (!window.confirm(`Delete ${serviceName} from your subscriptions?`)) {
      return;
    }

    setMessage("");

    const { error } = await supabase
      .from("subscriptions")
      .delete()
      .eq("id", id);

    if (error) {
      setMessage(`Couldn't delete subscription: ${error.message}`);
      return;
    }

    setSubscriptions((old) => old.filter((item) => item.id !== id));
    setMessage(`${serviceName} deleted.`);
  }

  async function logOut() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      setMessage(`Couldn't sign out: ${error.message}`);
      return;
    }

    window.location.href = "/login";
  }

  async function addSubscription(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");

    const { data: userData, error: userError } =
      await supabase.auth.getUser();

    if (userError || !userData.user) {
      setMessage("Please sign in again before adding a subscription.");
      setBusy(false);
      return;
    }

    const { error } = await supabase.from("subscriptions").insert({
      user_id: userData.user.id,
      name: name.trim(),
      category,
      amount: Number(amount),
      billing_interval: interval.toLowerCase(),
      next_renewal: renewal,
      usage_per_month: 0,
    });

    if (error) {
      setMessage(`Couldn't add subscription: ${error.message}`);
      setBusy(false);
      return;
    }

    setName("");
    setCategory("Entertainment");
    setAmount("");
    setInterval("Monthly");
    setRenewal("");
    setShowForm(false);

    await loadSubscriptions();
    setBusy(false);
  }

  const panel =
    "rounded-2xl border border-white/[0.08] bg-[#171923] shadow-lg shadow-black/10";

  const inputStyle =
    "mt-1 w-full rounded-xl border border-white/10 bg-[#171923] p-3 text-white outline-none transition focus:border-violet-400";

  return (
    <div className="min-h-screen bg-[#0b0c12] text-slate-100">
      <div className="flex min-h-screen">
        <aside className="hidden w-64 shrink-0 flex-col border-r border-white/[0.07] bg-[#101119] p-6 md:flex">
          <button
            onClick={() => goTo("dashboard")}
            className="mb-10 flex items-center gap-3 text-left"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-xl font-black text-white shadow-lg shadow-violet-500/20">
              S
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">
                SubLess<span className="text-violet-400">.</span>
              </h1>
              <p className="text-xs text-slate-500">Spend smarter.</p>
            </div>
          </button>

          <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Workspace
          </p>

          <nav className="space-y-2">
            <NavItem
              icon={<LayoutDashboard size={19} />}
              label="Dashboard"
              onClick={() => goTo("dashboard")}
              active
            />
            <NavItem
              icon={<CreditCard size={19} />}
              label="Subscriptions"
              onClick={() => goTo("subscriptions")}
            />
            <NavItem
              icon={<CalendarDays size={19} />}
              label="Renewals"
              onClick={() => goTo("renewals")}
            />
            <NavItem
              icon={<Sparkles size={19} />}
              label="AI Optimizer"
              onClick={() => goTo("optimizer")}
            />
            <NavItem
              icon={<Settings size={19} />}
              label="Settings"
              onClick={() => goTo("settings")}
            />
          </nav>

          <div className="mt-auto rounded-2xl border border-violet-400/15 bg-gradient-to-br from-violet-500/15 to-fuchsia-500/5 p-4">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-violet-400/15 text-violet-300">
              <Sparkles size={22} />
            </div>
            <p className="font-semibold">Spend smarter</p>
            <p className="mt-1 text-sm leading-6 text-slate-400">
              Find subscriptions you may no longer need.
            </p>
            <button
              onClick={() => goTo("optimizer")}
              className="mt-3 text-sm font-semibold text-violet-300 transition hover:text-fuchsia-300"
            >
              View suggestions →
            </button>
            <button
              onClick={() => void logOut()}
              className="mt-5 flex items-center gap-2 text-sm text-slate-400 transition hover:text-red-400"
            >
              <LogOut size={16} /> Log out
            </button>
          </div>
        </aside>

        <main id="dashboard" className="min-w-0 flex-1 p-5 sm:p-8 lg:p-10">
          <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-violet-300">
                YOUR FINANCIAL OVERVIEW
              </p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
                Dashboard<span className="text-violet-400">.</span>
              </h2>
              <p className="mt-2 text-slate-400">
                All your subscriptions, in one place.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={toggleTheme}
                aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
                title={darkMode ? "Light mode" : "Dark mode"}
                className="rounded-xl border border-white/10 bg-[#171923] p-3 text-slate-300 transition hover:border-violet-400/50 hover:text-violet-300"
              >
                {darkMode ? <Sun size={19} /> : <Moon size={19} />}
              </button>

              <div className="relative">
                <button
                  aria-label="Notifications"
                  aria-expanded={showNotifications}
                  onClick={() => setShowNotifications((v) => !v)}
                  className="relative rounded-xl border border-white/10 bg-[#171923] p-3 text-slate-300 transition hover:border-violet-400/50 hover:text-violet-300"
                >
                  <Bell size={19} />
                  {upcoming.length > 0 && (
                    <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-fuchsia-400" />
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 z-30 mt-2 w-72 rounded-2xl border border-white/10 bg-[#171923] p-4 shadow-2xl shadow-black/30">
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="font-semibold">Notifications</h3>
                      <button
                        aria-label="Close notifications"
                        onClick={() => setShowNotifications(false)}
                        className="text-slate-400 hover:text-white"
                      >
                        <X size={16} />
                      </button>
                    </div>
                    {upcoming.length ? (
                      <div className="space-y-3">
                        {upcoming.map((sub) => (
                          <div
                            key={sub.id}
                            className="border-b border-white/[0.06] pb-3 text-sm last:border-0 last:pb-0"
                          >
                            <p className="font-medium">{sub.name} renewal</p>
                            <p className="mt-1 text-slate-400">
                              {sub.renewal} · {money(sub.amount)}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-400">
                        No upcoming renewals yet. Add a subscription to see reminders here.
                      </p>
                    )}
                  </div>
                )}
              </div>

              <button
                onClick={() => setShowForm(true)}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-3 font-semibold text-white shadow-lg shadow-violet-600/20 transition hover:-translate-y-0.5 hover:shadow-violet-600/30"
              >
                <Plus size={18} /> Add subscription
              </button>
            </div>
          </header>

          {message && (
            <div
              role="status"
              className="mb-5 flex items-start justify-between gap-3 rounded-xl border border-violet-400/20 bg-violet-400/10 px-4 py-3 text-sm text-violet-200"
            >
              <span>{message}</span>
              <button
                aria-label="Dismiss message"
                onClick={() => setMessage("")}
              >
                <X size={16} />
              </button>
            </div>
          )}

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Stat
              title="Monthly spend"
              value={money(monthlySpend)}
              icon={<CircleDollarSign size={23} />}
              note="Estimated recurring cost"
              gradient="from-sky-500 to-teal-400"
            />
            <Stat
              title="Yearly projection"
              value={money(monthlySpend * 12)}
              icon={<TrendingDown size={23} />}
              note="If subscriptions continue"
              gradient="from-orange-500 to-amber-400"
            />
            <Stat
              title="Active subscriptions"
              value={String(subscriptions.length)}
              icon={<CreditCard size={23} />}
              note="Across your services"
              gradient="from-rose-500 to-pink-500"
            />
            <Stat
              title="Needs a review"
              value={String(lowUsage.length)}
              icon={<Sparkles size={23} />}
              note="Based on your usage entries"
              gradient="from-fuchsia-600 to-violet-500"
            />
          </section>

          <section className="mt-8 grid gap-6 xl:grid-cols-[1.6fr_1fr]">
            <div
              id="subscriptions"
              className={`${panel} scroll-mt-6 p-5 sm:p-6`}
            >
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold">Your subscriptions</h3>
                  <p className="mt-1 text-sm text-slate-400">
                    Track recurring payments and upcoming renewals.
                  </p>
                </div>

                <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#101119] px-3 py-2">
                  <Search size={17} className="text-slate-500" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search services"
                    className="w-32 bg-transparent text-sm text-white outline-none placeholder:text-slate-500 sm:w-40"
                  />
                </div>
              </div>

              {loading ? (
                <p className="flex items-center justify-center gap-2 py-8 text-sm text-slate-400">
                  <LoaderCircle className="animate-spin" size={17} />
                  Loading subscriptions…
                </p>
              ) : (
                <div className="space-y-3">
                  {filtered.map((sub) => (
                    <div
                      key={sub.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-[#101119]/70 p-4 transition hover:border-violet-400/30 hover:bg-[#1c1d2a]"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="flex h-11 w-11 items-center justify-center rounded-xl text-lg font-bold text-white shadow-lg"
                          style={{ backgroundColor: sub.color }}
                        >
                          {sub.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold">{sub.name}</p>
                          <p className="text-sm text-slate-400">
                            {sub.category} · {sub.interval}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-semibold">{money(sub.amount)}</p>
                          <p className="text-xs text-slate-500">
                            Renews {sub.renewal}
                          </p>
                        </div>
                        <button
                          onClick={() =>
                            void deleteSubscription(sub.id, sub.name)
                          }
                          aria-label={`Delete ${sub.name}`}
                          className="rounded-lg p-2 text-slate-500 transition hover:bg-red-500/10 hover:text-red-400"
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>
                    </div>
                  ))}

                  {filtered.length === 0 && (
                    <p className="py-8 text-center text-sm text-slate-400">
                      {search
                        ? "No matching subscriptions."
                        : "No subscriptions yet. Click Add subscription to get started."}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-6">
              <div id="renewals" className={`${panel} scroll-mt-6 p-6`}>
                <div className="mb-4 flex items-center gap-2">
                  <div className="rounded-xl bg-cyan-400/10 p-2 text-cyan-300">
                    <CalendarDays size={20} />
                  </div>
                  <h3 className="text-lg font-bold">Upcoming renewals</h3>
                </div>

                {upcoming.length ? (
                  upcoming.map((sub) => (
                    <div
                      key={sub.id}
                      className="flex items-center justify-between border-b border-white/[0.07] py-3 last:border-0"
                    >
                      <div>
                        <p className="font-medium">{sub.name}</p>
                        <p className="text-sm text-slate-400">
                          {sub.renewal}
                        </p>
                      </div>
                      <p className="font-semibold">{money(sub.amount)}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-400">
                    Your upcoming renewals will appear here after you add subscriptions.
                  </p>
                )}
              </div>

              <div
                id="optimizer"
                className="scroll-mt-6 rounded-2xl border border-violet-400/15 bg-gradient-to-br from-[#211638] to-[#171923] p-6 shadow-lg shadow-violet-950/10"
              >
                <div className="mb-3 flex items-center gap-2 text-violet-300">
                  <Sparkles size={21} />
                  <h3 className="font-bold">AI savings suggestions</h3>
                </div>

                {lowUsage.length ? (
                  lowUsage.map((sub) => (
                    <div
                      key={sub.id}
                      className="mb-3 rounded-xl border border-white/[0.07] bg-black/20 p-3 last:mb-0"
                    >
                      <p className="font-semibold">{sub.name}</p>
                      <p className="mt-1 text-sm leading-5 text-slate-400">
                        Usage is currently recorded as low. Review whether
                        this subscription is still worth the cost.
                      </p>
                      <p className="mt-2 text-sm font-semibold text-violet-300">
                        {money(
                          sub.interval === "Monthly"
                            ? sub.amount * 12
                            : sub.amount
                        )}{" "}
                        per year
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm leading-6 text-slate-400">
                    No low-usage subscriptions to review yet. Usage-based
                    suggestions will appear when usage data is available.
                  </p>
                )}

                <p className="mt-3 text-xs text-slate-500">
                  These are basic usage-based suggestions, not an external AI analysis.
                </p>
              </div>
            </div>
          </section>

          <p className="mt-8 flex items-center gap-2 text-xs text-slate-500">
            <CheckCircle2 size={15} className="text-emerald-400" />
            SubLess prototype · Your subscriptions are saved to your Supabase account.
          </p>
        </main>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <form
            onSubmit={addSubscription}
            className="w-full max-w-md space-y-4 rounded-2xl border border-white/10 bg-[#11121b] p-6 shadow-2xl shadow-black/40"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-violet-300">
                  New expense
                </p>
                <h3 className="mt-1 text-xl font-bold">Add subscription</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                aria-label="Close"
                className="rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <label className="block text-sm font-medium text-slate-300">
              Service name
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. YouTube Premium"
                className={inputStyle}
              />
            </label>

            <label className="block text-sm font-medium text-slate-300">
              Category
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className={inputStyle}
              >
                <option>Entertainment</option>
                <option>Music</option>
                <option>AI &amp; Tools</option>
                <option>Design</option>
                <option>Fitness</option>
                <option>Utilities</option>
                <option>Other</option>
              </select>
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="block text-sm font-medium text-slate-300">
                Amount (₹)
                <input
                  required
                  min="1"
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="499"
                  className={inputStyle}
                />
              </label>

              <label className="block text-sm font-medium text-slate-300">
                Billing
                <select
                  value={interval}
                  onChange={(e) =>
                    setInterval(e.target.value as "Monthly" | "Yearly")
                  }
                  className={inputStyle}
                >
                  <option>Monthly</option>
                  <option>Yearly</option>
                </select>
              </label>
            </div>

            <label className="block text-sm font-medium text-slate-300">
              Next renewal
              <input
                required
                type="date"
                value={renewal}
                onChange={(e) => setRenewal(e.target.value)}
                className={inputStyle}
              />
            </label>

            {message && (
              <p role="alert" className="text-sm text-red-400">
                {message}
              </p>
            )}

            <button
              disabled={busy}
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 p-3 font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
            >
              {busy && (
                <LoaderCircle size={17} className="animate-spin" />
              )}
              {busy ? "Saving…" : "Save subscription"}
            </button>
          </form>
        </div>
      )}

      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md space-y-4 rounded-2xl border border-white/10 bg-[#11121b] p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold">Settings</h3>
              <button
                aria-label="Close settings"
                onClick={() => setShowSettings(false)}
                className="rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>
            <p className="text-sm text-slate-400">
              Your account is managed securely through Supabase authentication.
            </p>
            <button
              onClick={() => void logOut()}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 p-3 font-semibold transition hover:bg-white/5"
            >
              <LogOut size={17} /> Log out
            </button>
            <button
              onClick={() => setShowSettings(false)}
              className="w-full rounded-xl bg-violet-600 p-3 font-semibold text-white transition hover:bg-violet-500"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function NavItem({
  icon,
  label,
  onClick,
  active = false,
}: {
  icon: ReactNode;
  label: string;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition ${
        active
          ? "border-violet-400/20 bg-violet-500/15 font-semibold text-violet-300"
          : "border-transparent text-slate-400 hover:border-white/[0.06] hover:bg-white/[0.04] hover:text-white"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function Stat({
  title,
  value,
  icon,
  note,
  gradient,
}: {
  title: string;
  value: string;
  icon: ReactNode;
  note: string;
  gradient: string;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${gradient} p-5 text-white shadow-lg transition duration-200 hover:-translate-y-1 hover:shadow-xl`}
    >
      <div className="absolute -right-8 -top-10 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-white/80">{title}</p>
          <p className="mt-3 break-words text-2xl font-bold tracking-tight sm:text-3xl">
            {value}
          </p>
        </div>
        <div className="rounded-xl bg-white/15 p-3">{icon}</div>
      </div>
      <p className="relative mt-4 text-xs text-white/75">{note}</p>
    </div>
  );
}