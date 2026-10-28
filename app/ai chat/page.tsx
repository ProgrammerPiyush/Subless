
"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowUp,
  Bot,
  Check,
  LoaderCircle,
  MessageCircle,
  Plus,
  Sparkles,
  Trash2,
  User,
  Wallet,
} from "lucide-react";
import { createClient } from "../lib/supabase/client";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

const suggestions = [
  {
    icon: Wallet,
    title: "Analyze my spending",
    prompt: "Analyze my subscription spending and explain where my money goes.",
  },
  {
    icon: Sparkles,
    title: "Find ways to save",
    prompt: "Suggest practical ways I could save money on my subscriptions.",
  },
  {
    icon: MessageCircle,
    title: "Review my subscriptions",
    prompt: "Help me decide which subscriptions I should review based on my data.",
  },
];

export default function AIChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [signedIn, setSignedIn] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const supabase = createClient();
    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSignedIn(Boolean(data.session));
      setCheckingAuth(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (active) setSignedIn(Boolean(session));
      }
    );

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function sendMessage(text?: string) {
    const message = (text ?? input).trim();

    if (!message || loading) return;

    if (message.length > 2000) {
      setError("Please keep your message under 2000 characters.");
      return;
    }

    if (!signedIn) {
      setError("Please sign in before chatting with SubLess AI.");
      return;
    }

    const previousMessages = messages;
    const updatedMessages: ChatMessage[] = [
      ...previousMessages,
      { role: "user", content: message },
    ];

    setMessages(updatedMessages);
    setInput("");
    setError("");
    setLoading(true);

    try {
      const supabase = createClient();
      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();

      const token = sessionData.session?.access_token;

      if (sessionError || !token) {
        throw new Error("Your session expired. Please sign in again.");
      }

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message,
          history: previousMessages.slice(-10),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "The AI couldn't respond.");
      }

      setMessages([
        ...updatedMessages,
        { role: "assistant", content: result.reply },
      ]);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  function startNewChat() {
    if (loading) return;
    setMessages([]);
    setInput("");
    setError("");
    inputRef.current?.focus();
  }

  return (
    <main className="min-h-screen bg-[#090711] text-white">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/3 h-96 w-96 rounded-full bg-violet-700/15 blur-[120px]" />
        <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-indigo-600/10 blur-[120px]" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-6xl">
        <aside className="hidden w-64 shrink-0 border-r border-white/[0.08] bg-[#0D0B17]/80 p-5 md:flex md:flex-col">
          <Link href="/" className="mb-8 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 font-bold shadow-lg shadow-violet-950/40">
              S
            </div>
            <div>
              <div className="text-lg font-bold tracking-tight">SubLess</div>
              <div className="text-xs text-slate-500">Spend smarter.</div>
            </div>
          </Link>

          <button
            onClick={startNewChat}
            disabled={loading}
            className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-medium transition hover:border-violet-400/40 hover:bg-violet-500/10 disabled:opacity-50"
          >
            <Plus size={17} /> New conversation
          </button>

          <div className="mt-8 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">
            Workspace
          </div>

          <nav className="mt-3 space-y-1">
            <Link
              href="/"
              className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-slate-400 transition hover:bg-white/5 hover:text-white"
            >
              <ArrowLeft size={17} /> Dashboard
            </Link>
            <Link
              href="/subscriptions"
              className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-slate-400 transition hover:bg-white/5 hover:text-white"
            >
              <Wallet size={17} /> Subscriptions
            </Link>
            <Link
              href="/optimizer"
              className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-slate-400 transition hover:bg-white/5 hover:text-white"
            >
              <Sparkles size={17} /> AI Optimizer
            </Link>
          </nav>

          <div className="mt-auto rounded-2xl border border-violet-400/15 bg-gradient-to-br from-violet-500/[0.12] to-indigo-500/[0.04] p-4">
            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-violet-400/15 text-violet-300">
              <Bot size={19} />
            </div>
            <p className="text-sm font-semibold">Your money, clearer.</p>
            <p className="mt-2 text-xs leading-5 text-slate-400">
              Get personalized insights from your subscription data.
            </p>
          </div>
        </aside>

        <section className="flex min-h-screen min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-10 flex items-center justify-between border-b border-white/[0.08] bg-[#090711]/85 px-4 py-4 backdrop-blur-xl sm:px-7">
            <div className="flex items-center gap-3">
              <Link
                href="/"
                aria-label="Back to dashboard"
                className="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white md:hidden"
              >
                <ArrowLeft size={19} />
              </Link>
              <div>
                <div className="flex items-center gap-2 font-semibold">
                  SubLess AI
                  <span className="rounded-full border border-violet-400/20 bg-violet-400/10 px-2 py-0.5 text-[10px] font-medium text-violet-300">
                    ASSISTANT
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  Subscription intelligence
                </div>
              </div>
            </div>

            <button
              onClick={startNewChat}
              disabled={loading}
              className="flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-300 transition hover:bg-white/5 disabled:opacity-50"
            >
              <Trash2 size={14} />
              <span className="hidden sm:inline">New chat</span>
            </button>
          </header>

          <div className="flex-1 px-4 py-8 sm:px-8">
            <div className="mx-auto max-w-3xl">
              {messages.length === 0 ? (
                <div className="flex min-h-[60vh] flex-col justify-center">
                  <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-violet-400/20 bg-gradient-to-br from-violet-500/20 to-indigo-500/10 text-violet-300 shadow-lg shadow-violet-950/20">
                    <Sparkles size={27} />
                  </div>

                  <h1 className="text-3xl font-semibold tracking-tight sm:text-5xl">
                    Let's make your
                    <span className="block bg-gradient-to-r from-violet-300 via-purple-300 to-indigo-300 bg-clip-text pb-2 text-transparent">
                      subscriptions smarter.
                    </span>
                  </h1>

                  <p className="mt-4 max-w-lg text-sm leading-6 text-slate-400 sm:text-base">
                    Hey! I'm your SubLess AI assistant. Ask me about spending,
                    renewals, and practical ways to save money.
                  </p>

                  <div className="mt-9 grid gap-3 sm:grid-cols-3">
                    {suggestions.map((item) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.title}
                          onClick={() => sendMessage(item.prompt)}
                          disabled={loading || checkingAuth}
                          className="group rounded-2xl border border-white/[0.09] bg-white/[0.025] p-4 text-left transition duration-200 hover:-translate-y-1 hover:border-violet-400/30 hover:bg-violet-500/[0.07] disabled:opacity-50"
                        >
                          <Icon
                            size={19}
                            className="mb-5 text-violet-300 transition group-hover:scale-110"
                          />
                          <div className="text-sm font-medium">
                            {item.title}
                          </div>
                          <p className="mt-2 text-xs leading-5 text-slate-500">
                            {item.prompt}
                          </p>
                        </button>
                      );
                    })}
                  </div>

                  {checkingAuth && (
                    <p className="mt-5 text-xs text-slate-500">
                      Checking your session...
                    </p>
                  )}
                  {!checkingAuth && !signedIn && (
                    <p className="mt-5 text-sm text-amber-300">
                      Please sign in to start chatting.
                      <Link href="/login" className="ml-2 underline">
                        Sign in
                      </Link>
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-7 pb-8">
                  {messages.map((message, index) => (
                    <div
                      key={`${index}-${message.role}`}
                      className={`flex gap-3 sm:gap-4 ${
                        message.role === "user" ? "justify-end" : ""
                      }`}
                    >
                      {message.role === "assistant" && (
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-violet-400/20 bg-violet-500/10 text-violet-300">
                          <Sparkles size={17} />
                        </div>
                      )}

                      <div
                        className={`max-w-[85%] whitespace-pre-wrap break-words text-sm leading-7 sm:text-[15px] ${
                          message.role === "user"
                            ? "rounded-2xl rounded-br-md border border-violet-400/15 bg-violet-500/[0.13] px-4 py-3 text-violet-50"
                            : "min-w-0 flex-1 pt-1 text-slate-200"
                        }`}
                      >
                        {message.content}
                      </div>

                      {message.role === "user" && (
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.06] text-slate-300">
                          <User size={17} />
                        </div>
                      )}
                    </div>
                  ))}

                  {loading && (
                    <div className="flex items-center gap-3 text-sm text-slate-400">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-violet-400/20 bg-violet-500/10 text-violet-300">
                        <Sparkles size={17} className="animate-pulse" />
                      </div>
                      <span className="animate-pulse">
                        SubLess AI is thinking...
                      </span>
                      <LoaderCircle
                        size={15}
                        className="animate-spin text-violet-300"
                      />
                    </div>
                  )}

                  <div ref={bottomRef} />
                </div>
              )}

              {error && (
                <div
                  role="alert"
                  className="mt-5 rounded-xl border border-red-400/20 bg-red-500/[0.07] px-4 py-3 text-sm text-red-200"
                >
                  {error}
                </div>
              )}
            </div>
          </div>

          <div className="sticky bottom-0 border-t border-white/[0.07] bg-[#090711]/90 px-4 pb-5 pt-4 backdrop-blur-xl sm:px-8">
            <form
              onSubmit={(event) => {
                event.preventDefault();
                void sendMessage();
              }}
              className="mx-auto max-w-3xl"
            >
              <div className="rounded-2xl border border-white/[0.12] bg-[#12101E] p-2 shadow-2xl shadow-black/20 transition focus-within:border-violet-400/40 focus-within:shadow-violet-950/10">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (
                      event.key === "Enter" &&
                      !event.shiftKey &&
                      !event.nativeEvent.isComposing
                    ) {
                      event.preventDefault();
                      void sendMessage();
                    }
                  }}
                  placeholder="Ask anything about your subscriptions..."
                  rows={2}
                  maxLength={2000}
                  disabled={loading || checkingAuth || !signedIn}
                  className="max-h-40 min-h-[56px] w-full resize-y bg-transparent px-3 py-3 text-sm leading-6 text-white outline-none placeholder:text-slate-600 disabled:opacity-50"
                />

                <div className="flex items-center justify-between px-2 pb-1">
                  <span className="text-[11px] text-slate-600">
                    AI can make mistakes. Check important details.
                  </span>
                  <button
                    type="submit"
                    disabled={
                      !input.trim() ||
                      loading ||
                      checkingAuth ||
                      !signedIn
                    }
                    aria-label="Send message"
                    className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-lg shadow-violet-950/30 transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    <ArrowUp size={18} />
                  </button>
                </div>
              </div>
              <p className="mt-3 text-center text-[10px] text-slate-600">
                Your subscription data is used to personalize your answers.
              </p>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}
