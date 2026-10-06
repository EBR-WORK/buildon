"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AlertIcon, CheckIcon, CloseIcon } from "@/components/icons";

/**
 * Toasts, and the confirmation that a deletion goes through.
 *
 * Why not window.confirm: it is a modal the browser draws, so it cannot say
 * what else a deletion breaks — the eleven blog posts linking to P-20, say —
 * it cannot be styled, and some browsers suppress it outright, which silently
 * turns "are you sure?" into "yes". A toast is ours to write and always shows.
 *
 * The confirm toast resolves a promise, so a caller still reads top to bottom:
 *
 *   if (!(await confirm({ title: "Delete this?" }))) return;
 *
 * Dismissing it, by Escape or the close button, resolves false. A pending
 * confirmation never resolves twice — see settle.
 */

type ToastTone = "info" | "success" | "danger";

type ToastItem = {
  id: number;
  tone: ToastTone;
  title: string;
  body?: string;
  /** Present only on a confirmation; absent on a plain notice. */
  confirmLabel?: string;
  resolve?: (ok: boolean) => void;
};

export type ConfirmOptions = {
  title: string;
  /** The consequences, in plain words. Shown under the title. */
  body?: string;
  /** The destructive button's words — "Delete", "Remove", "Discard". */
  confirmLabel?: string;
};

type ToastApi = {
  /** A notice that fades on its own. */
  notify: (title: string, body?: string, tone?: ToastTone) => void;
  /** A question that waits. Resolves false if dismissed. */
  confirm: (options: ConfirmOptions) => Promise<boolean>;
};

const ToastContext = createContext<ToastApi | null>(null);

/** How long a plain notice stays. Confirmations never auto-dismiss. */
const NOTICE_MS = 4000;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const nextId = useRef(1);

  const remove = useCallback((id: number) => {
    setItems((current) => current.filter((item) => item.id !== id));
  }, []);

  /**
   * Resolve a confirmation and take it off screen, exactly once.
   *
   * Both the buttons and the Escape key land here, and a quick Enter then
   * Escape would otherwise resolve the same promise twice — the second call
   * reading as a cancel after the delete had already run.
   */
  const settle = useCallback((id: number, answer: boolean) => {
    setItems((current) => {
      const item = current.find((entry) => entry.id === id);
      item?.resolve?.(answer);
      return current.filter((entry) => entry.id !== id);
    });
  }, []);

  const notify = useCallback(
    (title: string, body?: string, tone: ToastTone = "success") => {
      const id = nextId.current++;
      setItems((current) => [...current, { id, tone, title, body }]);
      window.setTimeout(() => remove(id), NOTICE_MS);
    },
    [remove],
  );

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      const id = nextId.current++;
      setItems((current) => [
        ...current,
        {
          id,
          tone: "danger",
          title: options.title,
          body: options.body,
          confirmLabel: options.confirmLabel ?? "Delete",
          resolve,
        },
      ]);
    });
  }, []);

  /* Escape cancels the newest confirmation — the one the editor is looking at
     — rather than all of them, so a stack unwinds one press at a time. */
  useEffect(() => {
    const pending = items.filter((item) => item.resolve);
    if (pending.length === 0) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      settle(pending[pending.length - 1].id, false);
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [items, settle]);

  const api = useMemo(() => ({ notify, confirm }), [notify, confirm]);

  return (
    <ToastContext.Provider value={api}>
      {children}

      {/* Fixed, above the save bar, and pointer-transparent between the cards
          so the form underneath stays usable while a notice is on screen. */}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex flex-col items-center gap-3 p-4 sm:items-end sm:p-6"
      >
        {items.map((item) => (
          <ToastCard key={item.id} item={item} onSettle={settle} onRemove={remove} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastCard({
  item,
  onSettle,
  onRemove,
}: {
  item: ToastItem;
  onSettle: (id: number, answer: boolean) => void;
  onRemove: (id: number) => void;
}) {
  const confirmRef = useRef<HTMLButtonElement>(null);
  const isConfirm = Boolean(item.resolve);

  /* Focus the destructive button so Enter answers and Escape cancels without
     reaching for the mouse. Safe as a default only because nothing here is
     reachable by accident: the toast appears in response to a click the editor
     has just made. */
  useEffect(() => {
    if (isConfirm) confirmRef.current?.focus();
  }, [isConfirm]);

  return (
    <div
      role={isConfirm ? "alertdialog" : "status"}
      className={`pointer-events-auto w-full max-w-sm rounded-2xl border bg-white p-4 shadow-[0_18px_40px_-12px_rgba(0,0,0,0.25)] ${
        item.tone === "danger" ? "border-signal-200" : "border-line"
      }`}
    >
      <div className="flex gap-3">
        <span
          className={`mt-0.5 grid size-8 shrink-0 place-items-center rounded-full ${
            item.tone === "danger"
              ? "bg-signal-50 text-signal-500"
              : "bg-brand-50 text-brand-500"
          }`}
        >
          {item.tone === "danger" ? (
            <AlertIcon className="size-4" />
          ) : (
            <CheckIcon className="size-4" />
          )}
        </span>

        <div className="min-w-0 flex-1">
          <p className="text-[15px] leading-snug font-semibold text-ink-900">{item.title}</p>
          {item.body && (
            <p className="mt-1 text-sm leading-relaxed whitespace-pre-line text-ink-500">
              {item.body}
            </p>
          )}

          {isConfirm && (
            <div className="mt-3.5 flex items-center gap-2">
              <button
                ref={confirmRef}
                type="button"
                onClick={() => onSettle(item.id, true)}
                className="cursor-pointer rounded-full bg-signal-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-signal-600 focus:ring-2 focus:ring-signal-500/30 focus:outline-none"
              >
                {item.confirmLabel}
              </button>
              <button
                type="button"
                onClick={() => onSettle(item.id, false)}
                className="cursor-pointer rounded-full border border-line px-4 py-2 text-sm font-semibold text-ink-700 transition hover:bg-surface"
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        <button
          type="button"
          aria-label={isConfirm ? "Cancel" : "Dismiss"}
          onClick={() => (isConfirm ? onSettle(item.id, false) : onRemove(item.id))}
          className="-mt-1 -mr-1 grid size-7 shrink-0 cursor-pointer place-items-center self-start rounded-lg text-ink-400 transition hover:bg-surface hover:text-ink-900"
        >
          <CloseIcon className="size-4" />
        </button>
      </div>
    </div>
  );
}

/**
 * The toast API.
 *
 * Throws outside the provider rather than returning a no-op: a delete whose
 * confirmation silently never appeared would go straight through.
 */
export function useToast() {
  const api = useContext(ToastContext);
  if (!api) throw new Error("useToast must be used inside <ToastProvider>.");
  return api;
}
