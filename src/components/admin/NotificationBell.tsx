"use client";

/**
 * The bell in the admin header.
 *
 * It lives here rather than on the dashboard because most roles never see the
 * dashboard: homeFor() sends each person to their first panel, and Presales —
 * who can be assigned leads — lands on the tracker and would never have been
 * told anything. A notification has to be where the person already is.
 */

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  dismissItem,
  loadNotifications,
  markSeen,
  type Stream,
  type StreamKey,
} from "@/lib/cms/notifications";
import { BellIcon, CloseIcon } from "@/components/icons";
import { useAdminMaybe } from "./AuthGate";

export default function NotificationBell() {
  /* Read here rather than passed in: the layout that places this is a server
     component, and the profile only exists on the client. */
  const profile = useAdminMaybe()?.profile ?? null;

  const [streams, setStreams] = useState<Stream[]>([]);
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!profile?.id) return;
    let alive = true;
    loadNotifications(profile).then((rows) => {
      if (alive) setStreams(rows);
    });
    return () => {
      alive = false;
    };
  }, [profile]);

  /* mousedown, not click, and scoped to a ref that wraps the button AND the
     panel — otherwise the press that opens an item closes the panel first and
     the link never fires. This project has had that bug once already. */
  useEffect(() => {
    if (!open) return;

    const onDown = (event: MouseEvent) => {
      if (!box.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const total = streams.reduce((n, stream) => n + stream.items.length, 0);

  /** One row, either by its × or by opening it. */
  async function dismissOne(stream: StreamKey, itemId: number) {
    /* Removed on screen first, and the stream with it when that was its last
       item — the panel should not sit open showing an empty heading. */
    setStreams((all) =>
      all
        .map((s) =>
          s.key === stream ? { ...s, items: s.items.filter((i) => i.id !== itemId) } : s,
        )
        .filter((s) => s.items.length > 0),
    );
    if (profile?.id) await dismissItem(profile.id, stream, itemId);
  }

  async function clearAll() {
    /* Cleared on screen first: the write records something already done —
       read them — and waiting on a round trip to acknowledge your own reading
       is the wrong way round. */
    const keys = streams.map((stream) => stream.key);
    setStreams([]);
    setOpen(false);
    if (profile?.id) await Promise.all(keys.map((key) => markSeen(profile.id, key)));
  }

  /* The bell stays whether or not there is anything in it.
     
     It used to disappear once everything was read, which made "Mark all read"
     look like it had removed the feature rather than cleared it — and left
     nowhere to go back and look. It changes colour instead: filled and
     badged when something is waiting, outlined and quiet when not. */
  const waiting = total > 0;

  return (
    <div ref={box} className="relative">
      <button
        type="button"
        onClick={() => setOpen((was) => !was)}
        aria-expanded={open}
        aria-label={
          waiting
            ? `${total} new ${total === 1 ? "notification" : "notifications"}`
            : "Notifications, nothing new"
        }
        className={`relative inline-flex size-9 cursor-pointer items-center justify-center rounded-full transition ${
          waiting
            ? "bg-brand-50 text-brand-600 hover:bg-brand-100"
            : "text-ink-400 hover:bg-surface hover:text-ink-700"
        }`}
      >
        <BellIcon className="size-5" />
        {waiting && (
          <span className="absolute -top-0.5 -right-0.5 inline-flex min-w-[1.1rem] justify-center rounded-full bg-brand-500 px-1 text-[11px] font-semibold text-white">
            {total > 9 ? "9+" : total}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-line bg-white shadow-lift">
          <div className="flex items-center justify-between gap-2 border-b border-line px-4 py-3">
            <span className="text-sm font-semibold text-ink-900">Notifications</span>
            {/* Nothing to mark when nothing is waiting. */}
            <button
              type="button"
              onClick={() => void clearAll()}
              disabled={!waiting}
              className="cursor-pointer text-sm text-brand-600 transition hover:text-brand-700 disabled:cursor-default disabled:text-ink-400 disabled:hover:text-ink-400"
            >
              Mark all read
            </button>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {!waiting && (
              <p className="px-4 py-6 text-center text-sm text-ink-500">
                Nothing new.
              </p>
            )}

            {streams.map((stream) => (
              <div key={stream.key}>
                <p className="bg-surface px-4 py-1.5 text-xs font-semibold text-ink-500">
                  {stream.items.length === 1
                    ? stream.one
                    : stream.many(stream.items.length)}
                </p>

                <ul>
                  {stream.items.slice(0, 8).map((item) => (
                    <li key={`${stream.key}-${item.id}`} className="group flex items-start">
                      <Link
                        href={`${stream.href}#${stream.anchor}-${item.id}`}
                        onClick={() => {
                          setOpen(false);
                          /* Opening it IS reading it. Having to dismiss it
                             afterwards as well would be a second chore for
                             one decision. */
                          void dismissOne(stream.key, item.id);
                        }}
                        className="min-w-0 flex-1 px-4 py-2.5 transition hover:bg-surface"
                      >
                        <span className="block text-[15px] font-medium text-ink-900">
                          {/* The sentence the person actually wants: who, and
                              about what. Without an actor it reads as the
                              arrival it is. */}
                          {item.by
                            ? `${item.by} assigned you ${item.title}`
                            : item.title}
                        </span>
                        {item.detail && (
                          <span className="mt-0.5 block text-sm text-ink-500">
                            {item.detail}
                          </span>
                        )}
                      </Link>

                      {/* Dismiss without going to look. Shown on hover and on
                          keyboard focus, so it is reachable without a mouse
                          but does not clutter the list. */}
                      <button
                        type="button"
                        onClick={() => void dismissOne(stream.key, item.id)}
                        aria-label={`Dismiss ${item.title}`}
                        className="mt-2.5 mr-2 inline-flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-full text-ink-400 opacity-0 transition group-hover:opacity-100 hover:bg-surface hover:text-ink-900 focus-visible:opacity-100"
                      >
                        <CloseIcon className="size-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>

                {stream.items.length > 8 && (
                  <p className="px-4 py-2 text-sm text-ink-500">
                    and {stream.items.length - 8} more.
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
