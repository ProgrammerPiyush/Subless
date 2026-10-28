
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  Clock,
  CreditCard,
  LoaderCircle,
  RefreshCw,
  Search,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { createClient } from "../lib/supabase/client";

type Subscription = {
  id: string;
  name: string;
  category: string;
  amount: number;
  billing_interval: string;
  next_renewal: string | null;
  status?: string;
};

function formatDate(date: string) {
  return new Date(date + "T00:00:00").toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function daysUntil(date: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const renewalDate = new Date(date + "T00:00:00");

  return Math.round(
    (renewalDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );
}

function money(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function RenewalsPage() {
  const supabase = useMemo(() => createClient(), []);

  const [items, setItems] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const loadRenewals = useCallback(async () => {
    setLoading(true);
    setMessage("");

    const { data: authData, error: authError } =
      await supabase.auth.getUser();

    if (authError || !authData.user) {
      setMessage("Please sign in to view your renewals.");
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", authData.user.id)
      .neq("status", "cancelled")
      .not("next_renewal", "is", null)
      .order("next_renewal", { ascending: true });

    if (error) {
      setMessage("Could not load renewals: " + error.message);
    } else {
      setItems((data ?? []) as Subscription[]);
    }

    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    void loadRenewals();
  }, [loadRenewals]);

  const upcoming = items.filter((item) => {
    if (!item.next_renewal) return false;
    return daysUntil(item.next_renewal) >= 0;
  });

  const dueSoon = upcoming.filter(
    (item) => daysUntil(item.next_renewal!) <= 7
  );

  const overdueItems = items.filter((item) => {
    if (!item.next_renewal) return false;
    return daysUntil(item.next_renewal) < 0;
  });

  const totalUpcoming = upcoming.reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0
  );

  const visibleItems = items.filter((item) => {
    if (!item.next_renewal) return false;

    const days = daysUntil(item.next_renewal);

    const query = search.toLowerCase();

    const matchesSearch =
      item.name.toLowerCase().includes(query) ||
      (item.category || "").toLowerCase().includes(query);

    let matchesFilter = true;

    if (filter === "7") matchesFilter = days >= 0 && days <= 7;
    if (filter === "30") matchesFilter = days >= 0 && days <= 30;
    if (filter === "overdue") matchesFilter = days < 0;

    return matchesSearch && matchesFilter;
  });

  const panel =
    "rounded-2xl border border-white/[0.08] bg-[#171923] shadow-lg shadow-black/10";

  return (
    <main className="min-h-screen bg-[#0b0c12] p-5 text-slate-100 md:p-10">
      <div className="mx-auto max-w-7xl">
        <Link
          href="/"
          className="mb-7 inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-violet-300"
        >
          <ArrowLeft size={18} />
          Back to Dashboard
        </Link>

        <header className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-violet-300">
              Workspace / Calendar
            </p>

            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
              Renewal Center<span className="text-violet-400">.</span>
            </h1>

            <p className="mt-2 text-slate-400">
              Stay ahead of every payment. No more renewal surprises.
            </p>
          </div>

          <button
            onClick={() => void loadRenewals()}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-[#171923] px-4 py-3 font-medium transition hover:border-violet-400/40 hover:text-violet-300 disabled:opacity-50"
          >
            <RefreshCw
              size={17}
              className={loading ? "animate-spin" : ""}
            />
            Refresh
          </button>
        </header>

        {message && (
          <div
            role="status"
            className="mb-5 rounded-xl border border-amber-400/20 bg-amber-400/10 p-4 text-sm text-amber-200"
          >
            {message}
          </div>
        )}

        <section className="relative mb-8 overflow-hidden rounded-3xl border border-violet-300/15 bg-gradient-to-br from-[#29164c] via-[#211638] to-[#12131d] p-6 shadow-xl shadow-violet-950/20 md:p-8">
          <div className="pointer-events-none absolute -right-12 -top-16 h-56 w-56 rounded-full bg-violet-500/20 blur-3xl" />

          <div className="relative flex flex-col justify-between gap-6 md:flex-row md:items-center">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-sm text-violet-200">
                <CalendarDays size={16} />
                Payment timeline
              </div>

              <h2 className="text-2xl font-bold">
                Your next payments, at a glance.
              </h2>

              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-300">
                Track what's coming up, identify overdue dates, and review
                every recurring charge from one place.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-5 backdrop-blur-sm md:min-w-56">
              <p className="text-sm text-slate-400">
                Upcoming payment total
              </p>
              <p className="mt-2 text-3xl font-bold">
                {money(totalUpcoming)}
              </p>
              <p className="mt-2 text-xs text-slate-400">
                {upcoming.length} upcoming renewal(s)
              </p>
            </div>
          </div>
        </section>

        <section className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Upcoming renewals"
            value={String(upcoming.length)}
            note="Today or a future date"
            icon={<CalendarDays size={22} />}
            gradient="from-sky-500 to-teal-400"
          />

          <StatCard
            title="Due within 7 days"
            value={String(dueSoon.length)}
            note="Payments needing attention"
            icon={<Clock size={22} />}
            gradient="from-orange-500 to-amber-400"
          />

          <StatCard
            title="Overdue renewals"
            value={String(overdueItems.length)}
            note="Dates before today"
            icon={<AlertTriangle size={22} />}
            gradient="from-rose-500 to-pink-600"
          />

          <StatCard
            title="Upcoming payment total"
            value={money(totalUpcoming)}
            note="Sum of upcoming listed charges"
            icon={<CreditCard size={22} />}
            gradient="from-violet-600 to-fuchsia-500"
          />
        </section>

        <section className={`${panel} p-5 md:p-7`}>
          <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <h2 className="text-xl font-bold">Renewal schedule</h2>
              <p className="mt-1 text-sm text-slate-400">
                Search, filter, and review your subscription renewal dates.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#101119] px-3 py-2.5 focus-within:border-violet-400/50">
                <Search size={18} className="text-slate-500" />

                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search services..."
                  className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500 sm:w-40"
                />
              </div>

              <select
                value={filter}
                onChange={(event) => setFilter(event.target.value)}
                className="rounded-xl border border-white/10 bg-[#101119] px-3 py-2.5 text-sm text-slate-200 outline-none focus:border-violet-400/50"
              >
                <option value="all">All dates</option>
                <option value="7">Next 7 days</option>
                <option value="30">Next 30 days</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-3 py-16 text-slate-400">
              <LoaderCircle size={22} className="animate-spin" />
              Loading your renewal schedule...
            </div>
          ) : visibleItems.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/15 px-5 py-14 text-center">
              <CalendarDays
                size={38}
                className="mx-auto mb-4 text-slate-500"
              />

              <h3 className="text-lg font-semibold">
                No matching renewals
              </h3>

              <p className="mt-2 text-sm text-slate-400">
                Try another filter, or add renewal dates to your subscriptions.
              </p>

              <Link
                href="/subscriptions"
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-2.5 font-semibold text-white transition hover:brightness-110"
              >
                <CreditCard size={17} />
                Manage subscriptions
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {visibleItems.map((item) => {
                const days = daysUntil(item.next_renewal!);
                const overdue = days < 0;
                const today = days === 0;

                return (
                  <article
                    key={item.id}
                    className="flex flex-col gap-4 rounded-xl border border-white/[0.07] bg-[#101119]/70 p-4 transition hover:border-violet-400/30 hover:bg-[#1c1d2a] sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
                          overdue
                            ? "bg-rose-400/10 text-rose-300"
                            : today
                              ? "bg-amber-400/10 text-amber-300"
                              : "bg-violet-400/10 text-violet-300"
                        }`}
                      >
                        {overdue ? (
                          <AlertTriangle size={22} />
                        ) : (
                          <CalendarDays size={22} />
                        )}
                      </div>

                      <div>
                        <h3 className="font-bold">{item.name}</h3>
                        <p className="mt-1 text-sm text-slate-400">
                          {item.category || "Other"} ·{" "}
                          {item.billing_interval || "Monthly"}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          Renewal: {formatDate(item.next_renewal!)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-4 sm:justify-end">
                      <div className="text-right">
                        <p className="text-lg font-bold">
                          {money(Number(item.amount) || 0)}
                        </p>

                        <span
                          className={`mt-1 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                            overdue
                              ? "bg-rose-400/10 text-rose-300"
                              : today || days <= 7
                                ? "bg-amber-400/10 text-amber-300"
                                : "bg-emerald-400/10 text-emerald-300"
                          }`}
                        >
                          {overdue
                            ? `${Math.abs(days)} day(s) overdue`
                            : today
                              ? "Due today"
                              : days === 1
                                ? "Due tomorrow"
                                : `In ${days} days`}
                        </span>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <div className="mt-6 flex items-center gap-2 text-xs text-slate-500">
          <CheckCircle2 size={15} className="text-emerald-400" />
          Renewal dates are loaded from your Supabase subscriptions.
        </div>
      </div>
    </main>
  );
}

function StatCard({
  title,
  value,
  note,
  icon,
  gradient,
}: {
  title: string;
  value: string;
  note: string;
  icon: React.ReactNode;
  gradient: string;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${gradient} p-5 text-white shadow-lg transition duration-200 hover:-translate-y-1 hover:shadow-xl`}
    >
      <div className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full bg-white/10 blur-2xl" />

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
