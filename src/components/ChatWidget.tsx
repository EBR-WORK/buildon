"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { chat, site } from "@/lib/content";

type ChatTopic = (typeof chat.options)[number]["topics"] extends
  | readonly (infer T)[]
  | undefined
  ? T
  : never;
import { ChatIcon, ChevronRightIcon, CloseIcon, SendIcon } from "./icons";

/**
 * The assistant in the bottom-right corner: a launcher that opens a chat panel
 * with a greeting, a menu of branches, and a box to type in.
 *
 * It answers from `chat` in content.ts and nothing else. The site is a static
 * export — there is no server at request time to send a question to — so the
 * honest shape is a decision tree that says what it does not know, rather than
 * a text box that implies an answer is coming.
 *
 * Typed text is matched on keywords against the same branches the menu offers.
 * One branch, "Leave an enquiry", takes over the input and asks for a name, a
 * number and a requirement, then hands them to a mail draft — the same ending
 * every other form on this site has.
 */

type ChatLink = { readonly label: string; readonly href: string };

type Message = {
  id: number;
  from: "bot" | "you";
  text: string;
  /** Answered inside the chat when pressed. */
  topics?: readonly ChatTopic[];
  /** Leaves the chat: a page, a phone number, a mail client. */
  links?: readonly ChatLink[];
  /** A picture that belongs with this reply. */
  image?: string;
  /** Rendered as the menu card. Only the latest one stays pressable. */
  menu?: boolean;
};

/** Where the enquiry branch is up to, or null when it is not running. */
type Enquiry = { step: number; answers: Record<string, string> };

const isReachable = (value: string) => value.replace(/\D/g, "").length >= 8;

let nextId = 0;

export default function ChatWidget({
  onOpenChange,
}: {
  /** Lets the page move anything else that lives in this corner out of the way. */
  onOpenChange?: (open: boolean) => void;
}) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [enquiry, setEnquiry] = useState<Enquiry | null>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const say = (text: string, extra: Partial<Message> = {}) =>
    setMessages((all) => [...all, { id: nextId++, from: "bot", text, ...extra }]);

  /**
   * Opening and closing in one place, because both have to tell the page as
   * well as themselves — and because the greeting is written on first open
   * rather than on mount: an unopened panel has no conversation, and writing
   * one early means the log is already scrolled when it finally appears.
   */
  function show(next: boolean) {
    setOpen(next);
    onOpenChange?.(next);
    if (next && messages.length === 0) {
      say(chat.greeting);
      say(chat.menuPrompt, { menu: true });
    }
  }

  // Keep the newest message in view. The log is the only thing that scrolls.
  useEffect(() => {
    const log = logRef.current;
    if (log) log.scrollTop = log.scrollHeight;
  }, [messages, open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      /* setOpen, not show(): Escape only closes, and `show` is rebuilt every
         render, which would make this listener re-bind on every message. */
      if (event.key === "Escape") {
        setOpen(false);
        onOpenChange?.(false);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  /* ------------------------------------------------------------- branches */

  function choose(id: string) {
    const option = chat.options.find((item) => item.id === id);
    if (!option) return;

    setMessages((all) => [...all, { id: nextId++, from: "you", text: option.label }]);

    /* Picking anything else abandons an enquiry in progress. Without this it
       kept running invisibly, and every later message was read as an answer to
       a question that had scrolled out of sight. */
    setEnquiry(null);

    if (option.asks) {
      setEnquiry({ step: 0, answers: {} });
      say(chat.enquiry.steps[0].ask);
      inputRef.current?.focus();
      return;
    }

    /* No menu underneath a reply that already offers choices. Repeating the
       same four rows under the product list pushed the list out of view and
       asked "anything else?" before the answer had been read. The way back to
       the menu is the button under the input, which is always there. */
    say(option.reply, { topics: option.topics, links: option.links });
    if (!option.topics && !option.links) say(chat.menuAgain, { menu: true });
  }

  /**
   * Answer one topic from the site's own copy.
   *
   * This is what the option rows used to do by navigating away. Reading it out
   * here keeps the conversation intact — the page is still one press further
   * on, for anyone who wants the whole thing.
   */
  function openTopic(topic: ChatTopic) {
    setMessages((all) => [...all, { id: nextId++, from: "you", text: topic.label }]);
    setEnquiry(null);
    say(topic.reply, {
      image: topic.image,
      links: topic.href ? [{ label: `Open ${topic.label}`, href: topic.href }] : undefined,
    });
  }

  /** Put the menu back, for anyone who has read an answer and wants the list. */
  function showMenu() {
    say(chat.menuPrompt, { menu: true });
  }

  /**
   * Abandon the enquiry without answering it.
   *
   * The questions take over the input, so without this the only way out of a
   * branch entered by accident is to reload the page.
   */
  function cancelEnquiry() {
    setEnquiry(null);
    say(chat.enquiry.cancelled, { menu: true });
  }

  /** The enquiry branch, one answer at a time. */
  function answer(text: string) {
    if (!enquiry) return;
    const step = chat.enquiry.steps[enquiry.step];

    const valid =
      step.field === "phone"
        ? isReachable(text)
        : step.field === "message"
          ? text.length >= 10
          : text.length >= 2;

    if (!valid) {
      say(step.invalid);
      return;
    }

    const answers = { ...enquiry.answers, [step.field]: text };
    const next = enquiry.step + 1;

    if (next < chat.enquiry.steps.length) {
      setEnquiry({ step: next, answers });
      say(chat.enquiry.steps[next].ask.replace("{name}", answers.name ?? ""));
      return;
    }

    setEnquiry(null);
    say(chat.enquiry.done.replace("{name}", answers.name ?? ""));
    say(chat.menuAgain, { menu: true });

    const body = [
      `Name: ${answers.name}`,
      `Phone: ${answers.phone}`,
      "",
      answers.message,
    ].join("\n");
    window.location.href = `mailto:${site.email}?subject=${encodeURIComponent(
      `Enquiry from ${answers.name}`,
    )}&body=${encodeURIComponent(body)}`;
  }

  /** Typed text: an answer if the enquiry is running, otherwise a keyword look-up. */
  function send(event: React.FormEvent) {
    event.preventDefault();
    const text = draft.trim();
    if (!text) return;

    setMessages((all) => [...all, { id: nextId++, from: "you", text }]);
    setDraft("");

    if (enquiry) {
      answer(text);
      return;
    }

    const lower = text.toLowerCase();
    const hit = chat.options.find((option) =>
      option.keywords.some((word) => lower.includes(word)),
    );

    if (!hit) {
      say(chat.fallback, { menu: true });
      return;
    }

    if (hit.asks) {
      setEnquiry({ step: 0, answers: {} });
      say(chat.enquiry.steps[0].ask);
      return;
    }

    say(hit.reply, { topics: hit.topics, links: hit.links });
    if (!hit.topics && !hit.links) say(chat.menuAgain, { menu: true });
  }

  /* --------------------------------------------------------------- render */

  // Only the last menu stays live: the ones further up belong to a part of the
  // conversation that has already been answered, and pressing them would start
  // a branch out of a reply that is no longer the end of the thread.
  /* Nothing is pressable while the questions are running: the input belongs to
     the enquiry, and a menu row pressed underneath it used to start a second
     branch on top of the first. Cancel, under the input, is the way out. */
  const liveMenu = enquiry
    ? undefined
    : [...messages].reverse().find((message) => message.menu)?.id;

  return (
    <>
      {open && (
        <div
          id="chat-panel"
          role="dialog"
          aria-label={`${chat.title} — ${chat.subtitle}`}
          /* Pinned above the launcher, and never taller than the viewport
             allows: a fixed height would push the input off a short screen. */
          className="fixed right-4 bottom-22 z-50 flex max-h-[min(32rem,calc(100dvh-8rem))] w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl bg-white shadow-[0_24px_60px_-12px_rgba(0,0,0,0.35)] sm:right-5 sm:w-[23rem]"
        >
          <header className="flex items-center gap-3 bg-brand-500 px-4 py-3 text-white">
            <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-white">
              <Image
                src="/brand/logo.png"
                alt=""
                width={32}
                height={32}
                className="h-auto w-8 object-contain"
              />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-display text-base font-semibold">
                {chat.title}
              </span>
              <span className="block truncate text-xs text-white/80">{chat.subtitle}</span>
            </span>
            <button
              suppressHydrationWarning
              type="button"
              onClick={() => show(false)}
              aria-label="Close chat"
              className="-mr-1 inline-flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-full transition hover:bg-white/15"
            >
              <CloseIcon className="size-4" />
            </button>
          </header>

          <div
            ref={logRef}
            aria-live="polite"
            className="flex-1 space-y-3 overflow-y-auto bg-surface px-4 py-4"
          >
            {messages.map((message) => (
              <div key={message.id}>
                <p
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                    message.from === "bot"
                      ? "rounded-bl-sm bg-ink-900 text-white"
                      : "ml-auto rounded-br-sm bg-brand-500 text-white"
                  }`}
                >
                  {message.text}
                </p>

                {message.image && (
                  <Image
                    src={message.image}
                    alt=""
                    width={320}
                    height={180}
                    className="mt-2 block w-full max-w-[85%] rounded-xl border border-line object-cover"
                  />
                )}

                {/* Topics, links and menu rows share one card shape: all three
                    are a stack of choices, and giving them different shapes
                    would suggest they behave differently. The arrow is what
                    marks the ones that leave the chat. */}
                {message.topics && message.topics.length > 0 && (
                  <div className="mt-2 overflow-hidden rounded-xl border border-line bg-white">
                    {message.topics.map((topic) => (
                      <button
                        suppressHydrationWarning
                        key={topic.id}
                        type="button"
                        onClick={() => openTopic(topic)}
                        className="block w-full cursor-pointer border-b border-line px-3.5 py-2.5 text-left text-sm text-brand-500 transition last:border-0 hover:bg-surface"
                      >
                        {topic.label}
                      </button>
                    ))}
                  </div>
                )}

                {message.links && (
                  <div className="mt-2 overflow-hidden rounded-xl border border-line bg-white">
                    {message.links.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        /* No onClick closing the panel. It used to, and that
                           unmounted this anchor in the same tick as the click —
                           the router never got it, so pressing a link appeared
                           to do nothing at all. The widget lives in the layout,
                           so it survives the navigation and the conversation is
                           still there on the next page. */
                        className="flex items-center justify-between gap-2 border-b border-line px-3.5 py-2.5 text-sm text-brand-500 transition last:border-0 hover:bg-surface"
                      >
                        {link.label}
                        <ChevronRightIcon className="size-4 shrink-0" />
                      </Link>
                    ))}
                  </div>
                )}

                {message.menu && (
                  <div className="mt-2 overflow-hidden rounded-xl border border-line bg-white">
                    {chat.options.map((option) => (
                      <button
                        suppressHydrationWarning
                        key={option.id}
                        type="button"
                        disabled={message.id !== liveMenu}
                        onClick={() => choose(option.id)}
                        className="block w-full cursor-pointer border-b border-line px-3.5 py-2.5 text-left text-sm text-brand-500 transition last:border-0 hover:bg-surface disabled:cursor-default disabled:text-ink-500"
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* One row, two jobs, never both: a way out of the questions while
              they are running, and a way back to the menu the rest of the
              time. */}
          {messages.length > 0 && (
            <button
              suppressHydrationWarning
              type="button"
              onClick={enquiry ? cancelEnquiry : showMenu}
              className={`cursor-pointer border-t border-line bg-white px-4 pt-2 text-left text-xs font-semibold transition ${
                enquiry
                  ? "text-ink-500 hover:text-signal-500"
                  : "text-ink-500 hover:text-brand-500"
              }`}
            >
              {enquiry ? "Cancel this enquiry" : "Show the menu"}
            </button>
          )}

          <form onSubmit={send} className={`flex items-center gap-2 bg-white px-3 py-2.5 ${messages.length > 0 ? "" : "border-t border-line"}`}>
            <input
              suppressHydrationWarning
              ref={inputRef}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder={chat.placeholder}
              aria-label={chat.placeholder}
              className="min-w-0 flex-1 bg-transparent px-1 py-1.5 text-sm outline-none placeholder:text-ink-500"
            />
            <button
              suppressHydrationWarning
              type="submit"
              disabled={!draft.trim()}
              aria-label="Send"
              className="inline-flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full bg-brand-500 text-white transition hover:bg-brand-600 disabled:cursor-default disabled:opacity-40"
            >
              <SendIcon className="size-4" />
            </button>
          </form>
        </div>
      )}

      {/* One launcher that turns into the close control, as the reference does:
          two separate buttons in the same corner is one too many. */}
      <button
        suppressHydrationWarning
        type="button"
        onClick={() => show(!open)}
        aria-expanded={open}
        aria-controls="chat-panel"
        aria-label={open ? "Close chat" : chat.launcher}
        className={`fixed right-4 bottom-4 z-50 grid size-14 cursor-pointer place-items-center rounded-full text-white shadow-lift transition sm:right-5 ${
          open ? "bg-accent-500 hover:bg-accent-600" : "bg-brand-500 hover:bg-brand-600"
        }`}
      >
        {open ? <CloseIcon className="size-6" /> : <ChatIcon className="size-6" />}
      </button>
    </>
  );
}
