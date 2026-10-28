
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Sparkles,
  TrendingDown,
  CreditCard,
  Lightbulb,
  RefreshCw,
  LoaderCircle,
  CircleAlert,
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
  usage_per_month?: number | null;
  status?: string;
  notes?: string | null;
};

function monthlyEquivalent(item: Subscription) {
  const amount = Number(item.amount) || 0;
  const interval = item.billing_interval?.toLowerCase();

  return interval === "yearly" || interval === "annual"
    ? amount / 12
    : amount;
}

function money(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function OptimizerPage() {
  const supabase = useMemo(() => createClient(), []);
  const [items, setItems] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const loadSubscriptions = useCallback(async () => {
    setLoading(true);
    setMessage("");

    const { data: authData, error: authError } =
      await supabase.auth.getUser();

    if (authError || !authData.user) {
      setMessage("Please sign in to analyze your subscriptions.");
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", authData.user.id)
      .neq("status", "cancelled")
      .order("name", { ascending: true });

    if (error) {
      setMessage("Could not load subscription data: " + error.message);
    } else {
      setItems((data ?? []) as Subscription[]);
    }

    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    void loadSubscriptions();
  }, [loadSubscriptions]);

  const monthlySpend = items.reduce(
    (sum, item) => sum + monthlyEquivalent(item),
    0
  );

  const yearlySpend = monthlySpend * 12;

  const categoryTotals = items.reduce<Record<string, number>>(
    (totals, item) => {
      const category = item.category || "Other";
      totals[category] =
        (totals[category] || 0) + monthlyEquivalent(item);
      return totals;
    },
    {}
  );

  const mostExpensiveCategory = Object.entries(categoryTotals).sort(
    (a, b) => b[1] - a[1]
  )[0];

  const lowUsage = items.filter(
    (item) =>
      item.usage_per_month != null &&
      Number(item.usage_per_month) <= 2
  );

  const suggestions = [
    ...lowUsage.map((item) => ({
      title: `Review ${item.name}`,
      description:
        `Your recorded usage is ${item.usage_per_month} time(s) per month. ` +
        "Consider whether this subscription is still worth its cost.",
      saving: monthlyEquivalent(item),
      category: item.category || "Other",
    })),
    ...(mostExpensiveCategory
      ? [
          {
            title: `Review your ${mostExpensiveCategory[0]} spending`,
            description:
              `${mostExpensiveCategory[0]} is your highest-spending category ` +
              `at ${money(mostExpensiveCategory[1])} per month. ` +
              "Compare plans and check for overlapping services.",
            saving: 0,
            category: mostExpensiveCategory[0],
          },
        ]
      : []),
    ...(items.length >= 2
      ? [
          {
            title: "Check for overlapping subscriptions",
            description:
              "Review services with similar purposes. You may not need every plan, " +
              "but compare their features before cancelling anything.",
            saving: 0,
            category: "General",
          },
        ]
      : []),
  ];

  const possibleMonthlySavings = suggestions.reduce(
    (sum, suggestion) => sum + suggestion.saving,
    0
  );

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
              Workspace / Intelligence
            </p>
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
              AI Savings Optimizer<span className="text-violet-400">.</span>
            </h1>
            <p className="mt-2 text-slate-400">
              Understand your spending and discover subscriptions worth reviewing.
            </p>
          </div>

          <button
            onClick={() => void loadSubscriptions()}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-[#171923] px-4 py-3 font-medium transition hover:border-violet-400/40 hover:text-violet-300 disabled:opacity-50"
          >
            <RefreshCw
              size={17}
              className={loading ? "animate-spin" : ""}
            />
            Refresh analysis
          </button>
        </header>

        <section className="relative mb-8 overflow-hidden rounded-3xl border border-violet-300/15 bg-gradient-to-br from-[#29164c] via-[#211638] to-[#12131d] p-7 shadow-xl shadow-violet-950/20 md:p-10">
          <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-violet-500/20 blur-3xl" />
          <div className="pointer-events-none absolute bottom-0 right-1/4 h-32 w-32 rounded-full bg-fuchsia-500/10 blur-3xl" />

          <div className="relative flex flex-col justify-between gap-8 md:flex-row md:items-center">
            <div className="max-w-2xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-violet-200/20 bg-white/[0.07] px-3 py-1.5 text-sm text-violet-200">
                <Sparkles size={16} />
                Subscription intelligence
              </div>
              <h2 className="text-2xl font-bold md:text-3xl">
                Make every subscription count.
              </h2>
              <p className="mt-3 leading-7 text-slate-300">
                Review your recurring costs, identify low-usage services,
                and find opportunities to spend more intentionally.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-5 backdrop-blur-sm md:min-w-56">
              <p className="text-sm text-slate-400">Monthly subscription spend</p>
              <p className="mt-2 text-3xl font-bold">
                {money(monthlySpend)}
              </p>
              <p className="mt-2 text-xs text-slate-400">
                Across your active subscriptions
              </p>
            </div>
          </div>
        </section>

        {message && (
          <div
            role="status"
            className="mb-5 flex items-start gap-3 rounded-xl border border-amber-400/20 bg-amber-400/10 p-4 text-sm text-amber-200"
          >
            <CircleAlert size={18} className="mt-0.5 shrink-0" />
            <span>{message}</span>
          </div>
        )}

        <section className="mb-8 grid gap-4 md:grid-cols-3">
          <div className={`${panel} p-6 transition duration-200 hover:-translate-y-1 hover:border-violet-400/30`}>
            <div className="mb-4 inline-flex rounded-xl bg-violet-400/10 p-3 text-violet-300">
              <CreditCard size={23} />
            </div>
            <p className="text-sm text-slate-400">Yearly spending projection</p>
            <p className="mt-2 break-words text-3xl font-bold">{money(yearlySpend)}</p>
            <p className="mt-2 text-xs text-slate-500">
              Based on your current recurring costs
            </p>
          </div>

          <div className={`${panel} p-6 transition duration-200 hover:-translate-y-1 hover:border-amber-400/30`}>
            <div className="mb-4 inline-flex rounded-xl bg-amber-400/10 p-3 text-amber-300">
              <CircleAlert size={23} />
            </div>
            <p className="text-sm text-slate-400">Low-usage services</p>
            <p className="mt-2 text-3xl font-bold">{lowUsage.length}</p>
            <p className="mt-2 text-xs text-slate-500">
              Recorded usage of two times or less per month
            </p>
          </div>

          <div className={`${panel} p-6 transition duration-200 hover:-translate-y-1 hover:border-emerald-400/30`}>
            <div className="mb-4 inline-flex rounded-xl bg-emerald-400/10 p-3 text-emerald-300">
              <TrendingDown size={23} />
            </div>
            <p className="text-sm text-slate-400">Potential monthly savings</p>
            <p className="mt-2 break-words text-3xl font-bold">
              {money(possibleMonthlySavings)}
            </p>
            <p className="mt-2 text-xs text-slate-500">
              Illustrative estimate if flagged services are cancelled
            </p>
          </div>
        </section>

        <section className={`${panel} mb-8 p-6 md:p-8`}>
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-xl border border-amber-300/10 bg-amber-400/10 p-3 text-amber-300">
              <Lightbulb size={22} />
            </div>
            <div>
              <h2 className="text-xl font-bold">Savings opportunities</h2>
              <p className="mt-1 text-sm text-slate-400">
                Suggestions based on the information saved in your account.
              </p>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-3 py-12 text-slate-400">
              <LoaderCircle size={22} className="animate-spin" />
              Analyzing your subscriptions...
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/15 px-5 py-12 text-center">
              <CreditCard size={36} className="mx-auto mb-4 text-slate-500" />
              <h3 className="text-lg font-semibold">Add subscriptions to begin</h3>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Once you have saved subscriptions, this page can analyze your
                spending and usage details.
              </p>
              <Link
                href="/subscriptions"
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-2.5 font-semibold text-white transition hover:brightness-110"
              >
                Manage subscriptions
              </Link>
            </div>
          ) : suggestions.length === 0 ? (
            <div className="rounded-xl border border-white/[0.07] bg-black/10 px-5 py-10 text-center">
              <CheckCircle2 size={32} className="mx-auto mb-3 text-emerald-300" />
              <h3 className="font-semibold">Your subscriptions are looking good</h3>
              <p className="mt-2 text-sm text-slate-400">
                No specific suggestions to show right now. Check back as your usage data changes.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {suggestions.map((suggestion, index) => (
                <article
                  key={`${suggestion.title}-${index}`}
                  className="flex flex-col justify-between gap-4 rounded-xl border border-white/[0.07] bg-[#101119]/70 p-5 transition hover:border-violet-400/25 hover:bg-[#1c1d2a] md:flex-row md:items-center"
                >
                  <div className="flex gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-400/10 bg-emerald-400/10 text-emerald-300">
                      <CheckCircle2 size={21} />
                    </div>
                    <div>
                      <h3 className="font-bold">{suggestion.title}</h3>
                      <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-400">
                        {suggestion.description}
                      </p>
                      <span className="mt-3 inline-flex rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1 text-xs font-medium text-slate-300">
                        {suggestion.category}
                      </span>
                    </div>
                  </div>

                  {suggestion.saving > 0 && (
                    <div className="shrink-0 md:text-right">
                      <p className="text-xs text-slate-500">
                        Monthly cost to review
                      </p>
                      <p className="mt-1 text-lg font-bold text-emerald-300">
                        {money(suggestion.saving)}
                      </p>
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}

          <p className="mt-6 text-xs leading-5 text-slate-500">
            These are rule-based suggestions, not AI-generated advice yet.
            Potential savings are not guaranteed. Review each subscription
            before making changes.
          </p>
        </section>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/subscriptions"
            className="rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-5 py-3 font-semibold text-white shadow-lg shadow-violet-950/20 transition hover:brightness-110"
          >
            Manage subscriptions
          </Link>
          <Link
            href="/renewals"
            className="rounded-xl border border-white/10 bg-[#171923] px-5 py-3 font-semibold text-slate-200 transition hover:border-violet-400/30 hover:text-violet-300"
          >
            View renewals
          </Link>
        </div>
      </div>
    </main>
  );
}
