
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  CreditCard,
  LoaderCircle,
  Plus,
  Search,
  Trash2,
  X,
  TrendingUp,
  Wallet,
  Layers3,
  Sparkles,
  Clock3,
  AlertTriangle,
} from "lucide-react";
import { createClient } from "../lib/supabase/client";

type Subscription = {
  id: string;
  name: string;
  category: string;
  amount: number;
  currency?: string;
  billing_interval: string;
  next_renewal: string | null;
  status?: string;
};

const categories = [
  "All",
  "Entertainment",
  "Music",
  "AI & Tools",
  "Design",
  "Fitness",
  "Utilities",
  "Other",
];

const chartColors = [
  "#7567f8",
  "#40b5e8",
  "#79859b",
  "#ec5b72",
  "#9aa8bb",
  "#4dc2b0",
  "#d65baf",
  "#f3a738",
];

function monthlyEquivalent(item: Subscription) {
  const amount = Number(item.amount) || 0;
  const cycle = (item.billing_interval || "Monthly").toLowerCase();

  if (cycle === "yearly" || cycle === "annual") return amount / 12;
  if (cycle === "weekly") return (amount * 52) / 12;
  if (cycle === "daily") return (amount * 365) / 12;

  return amount;
}

function money(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: amount < 100 ? 2 : 0,
  }).format(amount);
}

function formatDate(date: string) {
  return new Date(date + "T00:00:00").toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
}

function daysUntil(date: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(date + "T00:00:00");

  return Math.round(
    (target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );
}

function getProviderInitial(name: string) {
  return name.trim().charAt(0).toUpperCase() || "?";
}

export default function SubscriptionsPage() {
  const supabase = useMemo(() => createClient(), []);

  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [name, setName] = useState("");
  const [newCategory, setNewCategory] = useState("Entertainment");
  const [amount, setAmount] = useState("");
  const [interval, setInterval] = useState("Monthly");
  const [renewal, setRenewal] = useState("");
  const [monthLabels, setMonthLabels] = useState<string[]>([]);

  const loadSubscriptions = useCallback(async () => {
    setLoading(true);
    setMessage("");

    const { data: authData, error: authError } =
      await supabase.auth.getUser();

    if (authError || !authData.user) {
      setMessage("Please sign in to view your subscriptions.");
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", authData.user.id)
      .order("next_renewal", { ascending: true });

    if (error) {
      setMessage("Could not load subscriptions: " + error.message);
      setLoading(false);
      return;
    }

    setSubscriptions((data ?? []) as Subscription[]);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    void loadSubscriptions();
  }, [loadSubscriptions]);
  useEffect(() => {
  const now = new Date();

  const labels = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(
      now.getFullYear(),
      now.getMonth() - 5 + index,
      1
    );

    return date.toLocaleDateString("en-IN", { month: "short" });
  });

  setMonthLabels(labels);
}, []);

  const activeSubscriptions = subscriptions.filter(
    (item) => item.status !== "cancelled"
  );

  const monthlySpend = activeSubscriptions.reduce(
    (sum, item) => sum + monthlyEquivalent(item),
    0
  );

  const yearlySpend = monthlySpend * 12;

  const upcoming = activeSubscriptions
    .filter((item) => item.next_renewal && daysUntil(item.next_renewal) >= 0)
    .sort((a, b) => {
      if (!a.next_renewal || !b.next_renewal) return 0;
      return a.next_renewal.localeCompare(b.next_renewal);
    });

  const dueSoon = upcoming.filter(
    (item) => item.next_renewal && daysUntil(item.next_renewal) <= 30
  );

  const categoryTotals = activeSubscriptions.reduce<Record<string, number>>(
    (totals, item) => {
      const label = item.category || "Other";
      totals[label] = (totals[label] || 0) + monthlyEquivalent(item);
      return totals;
    },
    {}
  );

  const categoryData = Object.entries(categoryTotals)
    .map(([label, total]) => ({ label, total }))
    .sort((a, b) => b.total - a.total);

  const providerData = [...activeSubscriptions]
    .map((item) => ({ ...item, monthlyCost: monthlyEquivalent(item) }))
    .sort((a, b) => b.monthlyCost - a.monthlyCost)
    .slice(0, 6);

  const filteredSubscriptions = subscriptions.filter((item) => {
    const query = search.toLowerCase();

    const matchesSearch =
      item.name.toLowerCase().includes(query) ||
      (item.category || "").toLowerCase().includes(query);

    const matchesCategory =
      category === "All" || item.category === category;

    return matchesSearch && matchesCategory;
  });


  async function addSubscription(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    const { data: authData, error: authError } =
      await supabase.auth.getUser();

    if (authError || !authData.user) {
      setMessage("Please sign in before adding a subscription.");
      setSaving(false);
      return;
    }

    const { error } = await supabase.from("subscriptions").insert({
      user_id: authData.user.id,
      name: name.trim(),
      category: newCategory,
      amount: Number(amount),
      currency: "INR",
      billing_interval: interval,
      next_renewal: renewal || null,
      status: "active",
    });

    if (error) {
      setMessage("Could not save subscription: " + error.message);
      setSaving(false);
      return;
    }

    setName("");
    setAmount("");
    setRenewal("");
    setInterval("Monthly");
    setNewCategory("Entertainment");
    setShowForm(false);
    setMessage("Subscription added successfully!");

    await loadSubscriptions();
    setSaving(false);
  }

  async function deleteSubscription(item: Subscription) {
    const confirmed = window.confirm(
      `Delete ${item.name} from your subscriptions?`
    );

    if (!confirmed) return;

    setDeletingId(item.id);
    setMessage("");

    const { data: authData } = await supabase.auth.getUser();

    if (!authData.user) {
      setMessage("Please sign in again.");
      setDeletingId(null);
      return;
    }

    const { error } = await supabase
      .from("subscriptions")
      .delete()
      .eq("id", item.id)
      .eq("user_id", authData.user.id);

    if (error) {
      setMessage("Could not delete subscription: " + error.message);
    } else {
      setSubscriptions((current) =>
        current.filter((subscription) => subscription.id !== item.id)
      );
      setMessage(`${item.name} deleted successfully.`);
    }

    setDeletingId(null);
  }

  const panel =
    "rounded-2xl border border-white/[0.07] bg-[#131827] shadow-lg shadow-black/10";

  return (
    <main className="min-h-screen bg-[#0b0f19] p-4 text-slate-100 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-[1500px]">
        <header className="mb-7 flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <Link
              href="/"
              className="mb-4 inline-flex items-center gap-2 text-xs text-slate-400 transition hover:text-violet-300"
            >
              <ArrowLeft size={15} />
              Back to Dashboard
            </Link>

            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.25em] text-slate-500">
              Workspace / Overview
            </p>

            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Your subscriptions<span className="text-violet-400">.</span>
            </h1>

            <p className="mt-2 text-sm text-slate-400">
              Recurring spend at a glance.
            </p>
          </div>

          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-950/30 transition hover:-translate-y-0.5 hover:brightness-110"
          >
            <Plus size={18} />
            Add subscription
          </button>
        </header>

        {message && (
          <div
            role="status"
            className="mb-5 flex items-center justify-between gap-3 rounded-xl border border-violet-400/15 bg-violet-400/[0.08] p-4 text-sm text-violet-200"
          >
            <span>{message}</span>
            <button
              onClick={() => setMessage("")}
              aria-label="Dismiss message"
              className="shrink-0 text-violet-300 hover:text-white"
            >
              <X size={17} />
            </button>
          </div>
        )}

        <section className={`${panel} mb-5 p-4 sm:p-5`}>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Category
              </label>
              <select
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                className="w-full rounded-xl border border-white/[0.08] bg-[#0d1220] px-4 py-3 text-sm text-slate-200 outline-none transition focus:border-violet-400/50"
              >
                {categories.map((item) => (
                  <option key={item} value={item}>
                    {item === "All" ? "All categories" : item}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Search subscriptions
              </label>
              <div className="flex items-center gap-3 rounded-xl border border-white/[0.08] bg-[#0d1220] px-4 py-3 focus-within:border-violet-400/50">
                <Search size={17} className="shrink-0 text-slate-500" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search by name or category..."
                  className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-600"
                />
              </div>
            </div>
          </div>
        </section>

        {loading ? (
          <div className="flex min-h-72 items-center justify-center gap-3 text-slate-400">
            <LoaderCircle size={23} className="animate-spin text-violet-400" />
            Loading your subscriptions...
          </div>
        ) : (
          <>
            <section className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                title="Monthly spend"
                value={money(monthlySpend)}
                note="Estimated recurring monthly cost"
                icon={<Wallet size={18} />}
                color="violet"
              />

              <StatCard
                title="Yearly projection"
                value={money(yearlySpend)}
                note="Estimated cost over 12 months"
                icon={<TrendingUp size={18} />}
                color="orange"
              />

              <StatCard
                title="Active subscriptions"
                value={String(activeSubscriptions.length)}
                note="Currently listed as active"
                icon={<Layers3 size={18} />}
                color="blue"
              />

              <StatCard
                title="Upcoming renewals"
                value={String(dueSoon.length)}
                note="Renewals within the next 30 days"
                icon={<CalendarDays size={18} />}
                color="pink"
              />
            </section>

            <section className="mb-5 grid gap-5 xl:grid-cols-[1.25fr_1fr]">
              <div className={`${panel} p-5 sm:p-6`}>
                <div className="mb-5">
                  <h2 className="font-semibold">Spending trend</h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Estimated monthly cost using your current subscriptions.
                  </p>
                </div>

                <SpendTrend
                  labels={monthLabels}
                  monthlySpend={monthlySpend}
                />
              </div>

              <div className={`${panel} p-5 sm:p-6`}>
                <div className="mb-5">
                  <h2 className="font-semibold">Spend by category</h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Monthly-equivalent cost grouped by category.
                  </p>
                </div>

                {categoryData.length === 0 ? (
                  <EmptyChart />
                ) : (
                  <CategoryChart data={categoryData} />
                )}
              </div>
            </section>

            <section className={`${panel} mb-5 p-5 sm:p-6`}>
              <div className="mb-5 flex items-center justify-between gap-3">
                <div>
                  <h2 className="font-semibold">Upcoming renewals</h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Your next payments with renewal dates.
                  </p>
                </div>

                <Link
                  href="/renewals"
                  className="text-xs font-medium text-violet-300 transition hover:text-violet-200"
                >
                  View calendar →
                </Link>
              </div>

              {upcoming.length === 0 ? (
                <div className="rounded-xl border border-dashed border-white/10 py-8 text-center text-sm text-slate-500">
                  No upcoming renewal dates. Add a date to a subscription to
                  see it here.
                </div>
              ) : (
                <div className="grid gap-3 md:grid-cols-2">
                  {upcoming.slice(0, 6).map((item) => {
                    const days = daysUntil(item.next_renewal!);

                    return (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-[#0d1220] p-3.5 transition hover:border-violet-400/20"
                      >
                        <ProviderIcon name={item.name} />

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold">
                            {item.name}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {days === 0
                              ? "Due today"
                              : days === 1
                                ? "Due tomorrow"
                                : `In ${days} days`}
                            {" · "}
                            {formatDate(item.next_renewal!)}
                          </p>
                        </div>

                        <div className="text-right">
                          <p className="text-sm font-semibold">
                            {money(Number(item.amount) || 0)}
                          </p>
                          {days <= 7 && (
                            <p className="mt-1 text-[10px] text-amber-300">
                              <Clock3
                                size={11}
                                className="mr-1 inline"
                              />
                              Due soon
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            <section className={`${panel} mb-5 p-5 sm:p-6`}>
              <div className="mb-5 flex items-center justify-between gap-3">
                <div>
                  <h2 className="font-semibold">Top providers</h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Services ranked by monthly-equivalent cost.
                  </p>
                </div>
                <Sparkles size={18} className="text-violet-300" />
              </div>

              {providerData.length === 0 ? (
                <p className="py-8 text-center text-sm text-slate-500">
                  Add subscriptions to see your top providers.
                </p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {providerData.map((item) => {
                    const share =
                      monthlySpend > 0
                        ? (item.monthlyCost / monthlySpend) * 100
                        : 0;

                    return (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 rounded-xl border border-white/[0.05] bg-[#0d1220] p-3.5"
                      >
                        <ProviderIcon name={item.name} />

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold">
                            {item.name}
                          </p>
                          <p className="mt-1 text-[11px] text-slate-500">
                            {share.toFixed(1)}% of monthly spend
                          </p>
                        </div>

                        <p className="text-sm font-semibold">
                          {money(item.monthlyCost)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            <section className={`${panel} p-5 sm:p-6`}>
              <div className="mb-5 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                <div>
                  <h2 className="font-semibold">All subscriptions</h2>
                  <p className="mt-1 text-xs text-slate-500">
                    {filteredSubscriptions.length} matching subscription(s)
                  </p>
                </div>
              </div>

              {filteredSubscriptions.length === 0 ? (
                <div className="rounded-xl border border-dashed border-white/10 px-5 py-12 text-center">
                  <CreditCard
                    size={34}
                    className="mx-auto mb-4 text-slate-500"
                  />
                  <h3 className="font-semibold">No subscriptions found</h3>
                  <p className="mt-2 text-sm text-slate-500">
                    Try a different search or add a subscription.
                  </p>
                  <button
                    onClick={() => setShowForm(true)}
                    className="mt-5 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-500"
                  >
                    <Plus size={16} className="mr-1 inline" />
                    Add subscription
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[620px] text-left text-sm">
                    <thead>
                      <tr className="border-b border-white/[0.08] text-[10px] uppercase tracking-[0.16em] text-slate-500">
                        <th className="px-3 py-3 font-medium">Provider</th>
                        <th className="px-3 py-3 font-medium">Category</th>
                        <th className="px-3 py-3 font-medium">Billing</th>
                        <th className="px-3 py-3 font-medium">Next renewal</th>
                        <th className="px-3 py-3 text-right font-medium">
                          Amount
                        </th>
                        <th className="px-3 py-3 text-right font-medium">
                          Action
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredSubscriptions.map((item) => (
                        <tr
                          key={item.id}
                          className="border-b border-white/[0.05] transition last:border-0 hover:bg-white/[0.02]"
                        >
                          <td className="px-3 py-4">
                            <div className="flex items-center gap-3">
                              <ProviderIcon name={item.name} />
                              <span className="font-medium">{item.name}</span>
                            </div>
                          </td>
                          <td className="px-3 py-4 text-slate-400">
                            {item.category || "Other"}
                          </td>
                          <td className="px-3 py-4 text-slate-400">
                            {item.billing_interval || "Monthly"}
                          </td>
                          <td className="px-3 py-4 text-slate-400">
                            {item.next_renewal
                              ? formatDate(item.next_renewal)
                              : "Not set"}
                          </td>
                          <td className="px-3 py-4 text-right font-semibold">
                            {money(Number(item.amount) || 0)}
                          </td>
                          <td className="px-3 py-4 text-right">
                            <button
                              onClick={() => void deleteSubscription(item)}
                              disabled={deletingId === item.id}
                              aria-label={`Delete ${item.name}`}
                              title="Delete subscription"
                              className="rounded-lg p-2 text-slate-500 transition hover:bg-rose-400/10 hover:text-rose-300 disabled:opacity-50"
                            >
                              {deletingId === item.id ? (
                                <LoaderCircle
                                  size={17}
                                  className="animate-spin"
                                />
                              ) : (
                                <Trash2 size={17} />
                              )}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-subscription-title"
            className="my-auto w-full max-w-lg rounded-2xl border border-white/10 bg-[#151927] p-6 text-slate-100 shadow-2xl sm:p-8"
          >
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-violet-300">
                  New recurring payment
                </p>
                <h2 id="add-subscription-title" className="text-xl font-bold">
                  Add subscription
                </h2>
              </div>
              <button
                onClick={() => setShowForm(false)}
                aria-label="Close form"
                className="rounded-lg p-2 text-slate-400 transition hover:bg-white/5 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={addSubscription} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-300">
                  Service name
                </label>
                <input
                  required
                  maxLength={100}
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="e.g. Netflix"
                  className="w-full rounded-xl border border-white/10 bg-[#0d1220] px-4 py-3 text-sm outline-none transition focus:border-violet-400/50"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-300">
                  Category
                </label>
                <select
                  value={newCategory}
                  onChange={(event) => setNewCategory(event.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#0d1220] px-4 py-3 text-sm outline-none focus:border-violet-400/50"
                >
                  {categories
                    .filter((item) => item !== "All")
                    .map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-300">
                  Amount (₹)
                </label>
                <input
                  required
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  placeholder="499"
                  className="w-full rounded-xl border border-white/10 bg-[#0d1220] px-4 py-3 text-sm outline-none focus:border-violet-400/50"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-300">
                    Billing cycle
                  </label>
                  <select
                    value={interval}
                    onChange={(event) => setInterval(event.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-[#0d1220] px-4 py-3 text-sm outline-none focus:border-violet-400/50"
                  >
                    <option value="Monthly">Monthly</option>
                    <option value="Yearly">Yearly</option>
                    <option value="Weekly">Weekly</option>
                    <option value="Daily">Daily</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-300">
                    Next renewal
                  </label>
                  <input
                    type="date"
                    value={renewal}
                    onChange={(event) => setRenewal(event.target.value)}
                    className="w-full min-w-0 rounded-xl border border-white/10 bg-[#0d1220] px-3 py-3 text-sm outline-none focus:border-violet-400/50"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving && (
                  <LoaderCircle size={18} className="animate-spin" />
                )}
                {saving ? "Saving..." : "Save subscription"}
              </button>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}

function StatCard({
  title,
  value,
  note,
  icon,
  color,
}: {
  title: string;
  value: string;
  note: string;
  icon: React.ReactNode;
  color: "violet" | "orange" | "blue" | "pink";
}) {
  const styles = {
    violet: "from-violet-500/20 to-violet-500/[0.03] text-violet-300",
    orange: "from-orange-400/20 to-orange-400/[0.03] text-orange-300",
    blue: "from-sky-400/20 to-sky-400/[0.03] text-sky-300",
    pink: "from-pink-400/20 to-pink-400/[0.03] text-pink-300",
  };

  return (
    <div
      className={`rounded-2xl border border-white/[0.07] bg-gradient-to-br ${styles[color]} p-5 transition duration-200 hover:-translate-y-1 hover:border-white/[0.13]`}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-medium text-slate-400">{title}</p>
        <div className="rounded-lg bg-black/20 p-2">{icon}</div>
      </div>

      <p className="mt-4 break-words text-2xl font-semibold tracking-tight text-white">
        {value}
      </p>

      <p className="mt-2 text-[11px] text-slate-500">{note}</p>
    </div>
  );
}

function ProviderIcon({ name }: { name: string }) {
  const colors = [
    "bg-orange-500",
    "bg-violet-500",
    "bg-emerald-500",
    "bg-sky-500",
    "bg-pink-500",
    "bg-amber-500",
  ];

  const index = name
    .split("")
    .reduce((sum, character) => sum + character.charCodeAt(0), 0) % colors.length;

  return (
    <div
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${colors[index]} text-sm font-bold text-white shadow-lg shadow-black/10`}
      aria-hidden="true"
    >
      {getProviderInitial(name)}
    </div>
  );
}

function EmptyChart() {
  return (
    <div className="flex h-52 items-center justify-center rounded-xl border border-dashed border-white/10 text-sm text-slate-500">
      Add subscriptions to see category spending.
    </div>
  );
}


function SpendTrend({
  labels,
  monthlySpend,
}: {
  labels: string[];
  monthlySpend: number;
}) {
  const width = 560;
  const height = 230;
  const left = 52;
  const right = 15;
  const top = 18;
  const bottom = 32;
  const plotWidth = width - left - right;
  const plotHeight = height - top - bottom;

  // Always provide six labels, even during the first render.
  const safeLabels =
    labels.length === 6
      ? labels
      : ["May", "Jun", "Jul", "Aug", "Sep", "Oct"];

  const safeSpend = Number.isFinite(monthlySpend)
    ? Math.max(0, monthlySpend)
    : 0;

  const values = safeLabels.map(() => safeSpend);
  const maxValue = Math.max(safeSpend, 100) * 1.2;

  const points = values.map((value, index) => ({
    x:
      left +
      (plotWidth * index) / Math.max(values.length - 1, 1),
    y: top + plotHeight - (value / maxValue) * plotHeight,
  }));

  const line = points
    .map((point) => `${point.x},${point.y}`)
    .join(" ");

  const first = points[0];
  const last = points[points.length - 1];

  // Prevent the chart from crashing if points are ever empty.
  if (!first || !last) {
    return <div className="h-64 w-full" />;
  }

  const area = `${first.x},${top + plotHeight} ${line} ${last.x},${top + plotHeight}`;

  return (
    <div>
      <div className="mb-2 flex items-baseline gap-2">
        <span className="text-2xl font-semibold text-white">
          {money(safeSpend)}
        </span>
        <span className="text-xs text-slate-500">
          per month currently
        </span>
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="Estimated monthly subscription cost over six months"
        className="h-auto w-full overflow-visible"
      >
        {[0, 0.25, 0.5, 0.75, 1].map((fraction) => {
          const y = top + plotHeight * fraction;
          const value = maxValue * (1 - fraction);

          return (
            <g key={fraction}>
              <line
                x1={left}
                y1={y}
                x2={width - right}
                y2={y}
                stroke="#293044"
                strokeDasharray="4 5"
              />
              <text
                x={left - 9}
                y={y + 4}
                textAnchor="end"
                fill="#7c879d"
                fontSize="10"
              >
                {value >= 1000
                  ? `${Math.round(value / 1000)}k`
                  : Math.round(value)}
              </text>
            </g>
          );
        })}

        <polygon points={area} fill="#f5a13b" opacity="0.12" />

        <polyline
          points={line}
          fill="none"
          stroke="#f5a13b"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {points.map((point, index) => (
          <g key={`${safeLabels[index]}-${index}`}>
            <circle
              cx={point.x}
              cy={point.y}
              r="4"
              fill="#f5a13b"
              stroke="#131827"
              strokeWidth="2"
            />
            <text
              x={point.x}
              y={height - 8}
              textAnchor="middle"
              fill="#7c879d"
              fontSize="11"
            >
              {safeLabels[index]}
            </text>
          </g>
        ))}
      </svg>

      <p className="mt-1 text-[10px] text-slate-500">
        Flat estimate: historical transactions aren't available
        in the current subscription records.
      </p>
    </div>
  );
}


function CategoryChart({
  data,
}: {
  data: { label: string; total: number }[];
}) {
  const maxValue = Math.max(...data.map((item) => item.total), 1);
  const height = 190;

  return (
    <div>
      <div className="flex h-52 items-end gap-3 overflow-x-auto border-b border-white/[0.08] pb-0 pt-2">
        {data.map((item, index) => {
          const barHeight = Math.max(
            item.total > 0 ? 7 : 0,
            (item.total / maxValue) * height
          );

          return (
            <div
              key={item.label}
              className="flex h-full min-w-12 flex-1 flex-col items-center justify-end gap-2"
              title={`${item.label}: ${money(item.total)} per month`}
            >
              <span className="whitespace-nowrap text-[9px] text-slate-400">
                {money(item.total)}
              </span>
              <div
                className="w-full max-w-12 rounded-t-lg transition-all duration-300 hover:brightness-125"
                style={{
                  height: `${barHeight}px`,
                  backgroundColor: chartColors[index % chartColors.length],
                }}
              />
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex gap-3 overflow-x-auto">
        {data.map((item, index) => (
          <div
            key={item.label}
            className="flex min-w-12 flex-1 items-start gap-1.5"
          >
            <span
              className="mt-1 h-2 w-2 shrink-0 rounded-full"
              style={{
                backgroundColor: chartColors[index % chartColors.length],
              }}
            />
            <span className="max-w-20 text-[10px] leading-4 text-slate-400">
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
