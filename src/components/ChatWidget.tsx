"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { chat, productCatalogue, site } from "@/lib/content";
import { submitEnquiry } from "@/lib/cms/enquiries";
import { toDigits } from "@/lib/phone";
import { getDictionary } from "@/lib/i18n";
import { localeOf } from "@/lib/i18n/config";

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
  /** One-tap answers to the question in this message. */
  choices?: readonly string[];
  /** This step may be passed over. */
  skippable?: boolean;
};

/** Where the enquiry branch is up to, or null when it is not running. */
type Enquiry = { step: number; answers: Record<string, string> };

const isReachable = (value: string) => value.replace(/\D/g, "").length >= 8;

/* Deliberately loose. The point is to catch "i dont have one" before it is
   stored as an address, not to rule on what an address may contain. */
const looksLikeEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());

/* The shape a question has once the dictionary has supplied its words. Spelt
   out rather than derived from content.ts: that file's literal types describe
   the English script, and a Marathi question is not the string
   "Happy to help. What is your name?". */
type Step = {
  readonly field: string;
  readonly ask: string;
  readonly invalid: string;
  /** The shortest answer that counts; absent means the step may be skipped. */
  readonly min?: number;
  /** One-tap answers, when there are sensible ones. */
  readonly choices?: readonly string[];
};

/** A step with neither a minimum nor a format to meet can be passed over. */
const isOptional = (step: Step) =>
  step.field !== "phone" && step.field !== "email" && !("min" in step && step.min);

/** The typed quantity as a number, or undefined when it was skipped. */
const bags = (value: string | undefined) => {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : undefined;
};

function accepts(step: Step, text: string) {
  if (step.field === "phone") return isReachable(text);
  if (step.field === "email") return looksLikeEmail(text);
  /* Skipping is still allowed; what is refused is "a few" and "lots". */
  if (step.field === "quantity") return bags(text.trim()) !== undefined;
  const min = "min" in step && step.min ? step.min : 0;
  return text.trim().length >= min;
}

let nextId = 0;

export default function ChatWidget({
  onOpenChange,
}: {
  /** Lets the page move anything else that lives in this corner out of the way. */
  onOpenChange?: (open: boolean) => void;
}) {
  /* The panel, in the language of the page it is sitting on.
     
     Everything a visitor is asked or told comes from here. What stays in
     content.ts is the scripted ANSWERS — what a product is, which projects we
     supplied — because that is long marketing copy and three hand-written
     copies of it would go out of step three ways. The frame is what a visitor
     meets first, and the frame is translated. */
  const t = getDictionary(localeOf(usePathname() ?? "/"));

  /* The questions, in order, with their words taken from the dictionary and
     their rules from content.ts. Two sources because they are two different
     things: what to ask is a translation, how long an answer must be is not. */
  /* The menu rows. The script's own labels are the fallback, so a branch added
     to content.ts and not yet to the dictionary still appears — in English,
     in the right place, rather than as a blank row. */
  const labelFor = (id: string) =>
    t.chat.options[id as keyof typeof t.chat.options] ??
    chat.options.find((option) => option.id === id)?.label ??
    id;

  const productNames = productCatalogue.map((item) => item.name);

  const steps: Step[] = chat.enquiry.steps.map((step) => ({
    ...step,
    ask: t.chat.ask[step.field as keyof typeof t.chat.ask] ?? step.ask,
    invalid: t.chat.invalid[step.field as keyof typeof t.chat.invalid] ?? step.invalid,
    choices:
      step.field === "product"
        ? [...productNames, t.chat.notSure]
        : step.field === "timeline"
          ? t.chat.timeline
          : undefined,
  }));

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [enquiry, setEnquiry] = useState<Enquiry | null>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const say = (text: string, extra: Partial<Message> = {}) =>
    setMessages((all) => [...all, { id: nextId++, from: "bot", text, ...extra }]);

  /**
   * The visitor's own turn — and the end of the menu that offered it.
   *
   * The menu card used to stay where it was, greyed out and pressing nothing,
   * at the top of every conversation that had moved past it. On a phone it
   * took a third of the panel, so the question actually being asked sat below
   * the fold while four dead rows held the top of the screen.
   *
   * It is removed rather than disabled because it has already been answered:
   * the choice appears as the visitor's own message on the line below, which
   * is the record of what was picked. Leaving the list as well says the choice
   * is still open when it is not.
   */
  const youSaid = (text: string) =>
    setMessages((all) => {
      const spent = [...all].reverse().find((message) => message.menu);
      const kept = spent ? all.filter((message) => message.id !== spent.id) : all;
      return [...kept, { id: nextId++, from: "you", text }];
    });

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
      say(t.chat.greeting);
      say(t.chat.menuPrompt, { menu: true });
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

    youSaid(labelFor(option.id));

    /* Picking anything else abandons an enquiry in progress. Without this it
       kept running invisibly, and every later message was read as an answer to
       a question that had scrolled out of sight. */
    setEnquiry(null);

    if (option.asks) {
      setEnquiry({ step: 0, answers: {} });
      ask(0, {});
      inputRef.current?.focus();
      return;
    }

    /* No menu underneath a reply that already offers choices. Repeating the
       same four rows under the product list pushed the list out of view and
       asked "anything else?" before the answer had been read. The way back to
       the menu is the button under the input, which is always there. */
    say(option.reply, { topics: option.topics, links: option.links });
    if (!option.topics && !option.links) say(t.chat.menuAgain, { menu: true });
  }

  /**
   * Answer one topic from the site's own copy.
   *
   * This is what the option rows used to do by navigating away. Reading it out
   * here keeps the conversation intact — the page is still one press further
   * on, for anyone who wants the whole thing.
   */
  function openTopic(topic: ChatTopic) {
    youSaid(topic.label);
    setEnquiry(null);
    say(topic.reply, {
      image: topic.image,
      links: topic.href ? [{ label: `Open ${topic.label}`, href: topic.href }] : undefined,
    });
  }

  /** Put the menu back, for anyone who has read an answer and wants the list. */
  function showMenu() {
    say(t.chat.menuPrompt, { menu: true });
  }

  /**
   * Abandon the enquiry without answering it.
   *
   * The questions take over the input, so without this the only way out of a
   * branch entered by accident is to reload the page.
   */
  function cancelEnquiry() {
    setEnquiry(null);
    say(t.chat.cancelled, { menu: true });
  }

  /**
   * Take the suggestions off a question that has been answered.
   *
   * Only once the answer is accepted — a rejected one leaves them in place,
   * because the question is being asked again and the chips are the easiest
   * way to answer it. Ten dead product chips above the live question is the
   * same problem the spent menu had, one layer down.
   */
  const retireChoices = () =>
    setMessages((all) => {
      const spent = [...all]
        .reverse()
        .find((message) => message.choices || message.skippable);
      if (!spent) return all;
      return all.map((message) =>
        message.id === spent.id
          ? { ...message, choices: undefined, skippable: false }
          : message,
      );
    });

  /** Ask the step at `index`, with its suggestions under it. */
  function ask(index: number, answers: Record<string, string>) {
    const step = steps[index];
    say(step.ask.replace("{name}", answers.name ?? ""), {
      choices: "choices" in step ? step.choices : undefined,
      skippable: isOptional(step),
    });
  }

  /**
   * What the desk reads.
   *
   * The requirement answers are folded into one message rather than given
   * columns of their own: the leads table has none for a quantity or a date,
   * and inventing three would mean a migration every time this script gains a
   * question. Written as lines so it stays readable in the panel.
   */
  function describe(answers: Record<string, string>) {
    /* Quantity is not here: it has a column of its own since 0025. */
    const lines = [
      answers.product ? `Product: ${answers.product}` : "",
      answers.place ? `Site: ${answers.place}` : "",
      answers.timeline ? `Needed: ${answers.timeline}` : "",
    ].filter(Boolean);

    /* The insert policy wants at least ten characters, and an enquiry where
       every optional question was skipped would be shorter than that. */
    return lines.length > 0
      ? `Enquiry left in the chat assistant.\n${lines.join("\n")}`
      : "Enquiry left in the chat assistant. No details given.";
  }

  /**
   * Store it, and say so.
   *
   * It goes to the same table as every other form on the site, so it reaches
   * the admin panel and the CRM by the road that is already built. The mail
   * draft is what happens when that write fails — handing the visitor their
   * own words back beats an assistant that swallowed them.
   */
  function finish(answers: Record<string, string>) {
    setEnquiry(null);
    say(t.chat.sending);

    const message = describe(answers);

    submitEnquiry({
      name: answers.name,
      email: answers.email,
      phone: answers.phone,
      message,
      product: answers.product === "Not sure yet" ? "" : answers.product,
      quantity: bags(answers.quantity),
      enquiryType: "Chat assistant",
      source: "Chat widget",
      page: window.location.pathname,
    }).then(
      () => {
        say(
          t.chat.done
            .replace("{name}", answers.name ?? "")
            .replace("{phone}", answers.phone ?? ""),
        );
        say(t.chat.menuAgain, { menu: true });
      },
      () => {
        say(t.chat.failed);
        say(t.chat.menuAgain, { menu: true });

        const body = [
          `Name: ${answers.name}`,
          `Phone: ${answers.phone}`,
          `Email: ${answers.email}`,
          "",
          message,
        ].join("\n");
        window.location.href = `mailto:${site.enquiryEmail}?subject=${encodeURIComponent(
          `Enquiry from ${answers.name}`,
        )}&body=${encodeURIComponent(body)}`;
      },
    );
  }

  /** The enquiry branch, one answer at a time. */
  function answer(text: string) {
    if (!enquiry) return;
    const step = steps[enquiry.step];

    if (!accepts(step, text)) {
      say(step.invalid || "Could you put that another way?");
      return;
    }

    retireChoices();

    /* The phone answer is kept as digits, like every box on the site.
       isReachable only counts the digits, so "98765 43210 after 6pm" passed
       and was stored whole — a number nobody can dial without editing it. */
    const value = step.field === "phone" ? toDigits(text) : text.trim();
    const answers = { ...enquiry.answers, [step.field]: value };
    const next = enquiry.step + 1;

    if (next < steps.length) {
      setEnquiry({ step: next, answers });
      ask(next, answers);
      return;
    }

    finish(answers);
  }

  /** Pass over a question that has no answer worth waiting for. */
  function skipStep() {
    if (!enquiry) return;
    retireChoices();

    const answers = { ...enquiry.answers };
    const next = enquiry.step + 1;

    youSaid(t.chat.skip);

    if (next < steps.length) {
      setEnquiry({ step: next, answers });
      ask(next, answers);
      return;
    }

    finish(answers);
  }

  /** Typed text: an answer if the enquiry is running, otherwise a keyword look-up. */
  function send(event: React.FormEvent) {
    event.preventDefault();
    const text = draft.trim();
    if (!text) return;

    youSaid(text);
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
      say(t.chat.fallback, { menu: true });
      return;
    }

    if (hit.asks) {
      setEnquiry({ step: 0, answers: {} });
      ask(0, {});
      return;
    }

    say(hit.reply, { topics: hit.topics, links: hit.links });
    if (!hit.topics && !hit.links) say(t.chat.menuAgain, { menu: true });
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

  /* The suggestions under the question being asked right now. Earlier ones are
     answers to questions already given, and pressing one would send it as the
     answer to a different question. */
  const liveChoices = enquiry
    ? [...messages].reverse().find((message) => message.choices || message.skippable)?.id
    : undefined;

  return (
    <>
      {open && (
        <div
          id="chat-panel"
          role="dialog"
          aria-label={`${chat.title} — ${t.chat.subtitle}`}
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
              <span className="block truncate text-xs text-white/80">{t.chat.subtitle}</span>
            </span>
            <button
              suppressHydrationWarning
              type="button"
              onClick={() => show(false)}
              aria-label={t.chat.closeChat}
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

                {/* One-tap answers to the question above. Suggestions, not a
                    closed list: anything typed instead is taken as the answer,
                    which is why the input stays open underneath. */}
                {((message.choices && message.choices.length > 0) ||
                  message.skippable) && (
                  <div className="mt-2 flex max-w-[85%] flex-wrap gap-1.5">
                    {(message.choices ?? []).map((choice) => (
                      <button
                        suppressHydrationWarning
                        key={choice}
                        type="button"
                        disabled={message.id !== liveChoices}
                        onClick={() => {
                          youSaid(choice);
                          answer(choice);
                        }}
                        className="cursor-pointer rounded-full border border-brand-200 bg-white px-3 py-1.5 text-xs font-medium text-brand-500 transition hover:border-brand-500 hover:bg-brand-50 disabled:cursor-default disabled:border-line disabled:text-ink-500"
                      >
                        {choice}
                      </button>
                    ))}

                    {message.skippable && (
                      <button
                        suppressHydrationWarning
                        type="button"
                        disabled={message.id !== liveChoices}
                        onClick={skipStep}
                        className="cursor-pointer rounded-full px-3 py-1.5 text-xs font-medium text-ink-500 underline underline-offset-2 transition hover:text-ink-900 disabled:cursor-default disabled:no-underline"
                      >
                        {t.chat.skip}
                      </button>
                    )}
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
                        {labelFor(option.id)}
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
              {enquiry ? t.chat.cancelEnquiry : t.chat.showMenu}
            </button>
          )}

          <form onSubmit={send} className={`flex items-center gap-2 bg-white px-3 py-2.5 ${messages.length > 0 ? "" : "border-t border-line"}`}>
            <input
              suppressHydrationWarning
              ref={inputRef}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder={t.chat.placeholder}
              aria-label={t.chat.placeholder}
              className="min-w-0 flex-1 bg-transparent px-1 py-1.5 text-sm outline-none placeholder:text-ink-500"
            />
            <button
              suppressHydrationWarning
              type="submit"
              disabled={!draft.trim()}
              aria-label={t.actions.send}
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
        aria-label={open ? t.chat.closeChat : t.chat.launcher}
        className={`fixed right-4 bottom-4 z-50 grid size-14 cursor-pointer place-items-center rounded-full text-white shadow-lift transition sm:right-5 ${
          open ? "bg-accent-500 hover:bg-accent-600" : "bg-brand-500 hover:bg-brand-600"
        }`}
      >
        {open ? <CloseIcon className="size-6" /> : <ChatIcon className="size-6" />}
      </button>
    </>
  );
}
