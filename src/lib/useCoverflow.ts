"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

/**
 * A carousel whose cards stand in a row receding into the page.
 *
 * The scroll-snap version this replaces could turn a card but never move it
 * backwards: everything in a scroller sits on the same plane, so a tilted card
 * is a tilted card beside its neighbour rather than one standing behind it.
 * Depth is what the reference actually shows, and depth needs the cards taken
 * out of flow and placed by hand.
 *
 * The position is a fraction, not an index. Halfway through a drag the centre
 * is at 2.4, and every card's angle, depth and fade is read off that — which
 * is why the row follows a finger instead of jumping between two arrangements.
 *
 * Painting goes straight to the DOM inside requestAnimationFrame. Sixty state
 * updates a second would re-render every card for numbers React never needs to
 * see, and the style write is the only thing that has to happen.
 */

type Options = {
  count: number;
  /** Degrees the first neighbour is turned. */
  rotate?: number;
  /** How far it recedes, as a fraction of card width. */
  depth?: number;
  /**
   * Exponent on distance. Below 1 the rake eases off as cards travel out —
   * a linear ramp folds the second card shut before anyone can read it.
   */
  falloff?: number;
  /** How much the first neighbour shrinks, as a fraction. */
  shrink?: number;
  /** Gap between cards, as a fraction of card width. */
  gap?: number;
  /** Wrap around, with no cloned nodes — see the fold in paint(). */
  loop?: boolean;
};

export function useCoverflow({
  count,
  /* Read off sakarni.com's Swiper config, converted from its units:
       coverflowEffect.rotate 5 x modifier 2.5  ->  12.5 degrees per step
       coverflowEffect.depth 70 x modifier 2.5  ->  175px, ~0.55 of a card
       spaceBetween 135 on ~310px slides        ->  0.44 of a card
     The turn is far subtler than it looks in a screenshot — most of what
     reads as "tilted" is the recession, not the rotation. */
  rotate = 12.5,
  depth = 0.55,
  /* Linear, as Swiper's modifier is: the second card out gets twice the turn
     of the first, not the eased-off curve a lower exponent would give. */
  falloff = 1,
  shrink = 0,
  gap = 0.44,
  loop = true,
}: Options) {
  const frameRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLElement | null)[]>([]);

  /** Fractional card index at the centre. The single source of truth. */
  const posRef = useRef(0);
  /** Where the current settle is headed. Stepping off `pos` would swallow a
      press that lands mid-flight, before the rounding has moved. */
  const targetRef = useRef(0);
  const widthRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const dragRef = useRef<{ id: number; x: number; pos: number; v: number; t: number } | null>(null);

  const [selected, setSelected] = useState(0);

  /**
   * False on the server and during the first client render, true after.
   *
   * useSyncExternalStore rather than a mounted flag set in an effect: the two
   * snapshots are exactly what this needs to say — the server renders a plain
   * row, the client takes over and places the cards — and React treats the
   * change as a hydration boundary rather than as a state update chasing one.
   */
  const ready = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const indexAt = useCallback(
    (pos: number) => ((Math.round(pos) % count) + count) % count,
    [count],
  );

  const clamp = useCallback(
    (pos: number) => (loop ? pos : Math.max(0, Math.min(count - 1, pos))),
    [count, loop],
  );

  const paint = useCallback(() => {
    const width = widthRef.current;
    if (!width) return;

    const pitch = width * (1 + gap);
    const pos = posRef.current;

    cardRefs.current.forEach((card, index) => {
      if (!card) return;

      /* Fold the distance into the shorter way round the ring. This is the
         whole looping mechanism — no cloned nodes, no shuffling the DOM. */
      let offset = index - pos;
      if (loop) {
        offset = ((offset % count) + count) % count;
        if (offset > count / 2) offset -= count;
      }

      const distance = Math.abs(offset);
      const ramp = Math.pow(distance, falloff);
      /* Capped short of edge-on, so a far card never turns its back and
         disappears into a line. */
      const tilt = Math.min(rotate * ramp, 78) * Math.sign(offset);

      card.style.transform =
        `translateX(calc(-50% + ${(offset * pitch).toFixed(2)}px)) ` +
        `translateZ(${(-depth * width * ramp).toFixed(2)}px) ` +
        `rotateY(${(-tilt).toFixed(2)}deg)` +
        /* No scale by default. The reference has none: a card that has receded
           175px under a perspective lens is already smaller, and scaling it
           again shrinks it twice. */
        (shrink ? ` scale(${(1 - Math.min(distance, 1) * shrink).toFixed(3)})` : "");

      /* Opacity is not painted here.
         The reference fades in two states — every card at 0.4, the centred one
         at 1 — with a half-second CSS transition, and the component sets it
         from `selected`. Writing a per-frame value here would override that
         transition sixty times a second and flatten it into a hard cut.

         The one exception is the far side of the ring: a card is teleported
         across at exactly half a turn out, so it must be invisible by then or
         the jump shows. That is geometry, not styling, so it belongs here. */
      if (loop) {
        const edge = Math.min(1, Math.max(0, count / 2 - distance));
        card.style.visibility = edge <= 0 ? "hidden" : "visible";
      }
      card.style.zIndex = `${100 - Math.round(distance * 10)}`;
      /* Only the centre card is a target: the others are turned away and
         partly behind their neighbours, so a click lands on a face nobody can
         properly see. */
      card.style.pointerEvents = distance < 0.5 ? "auto" : "none";
    });
  }, [count, depth, falloff, gap, loop, rotate, shrink]);

  const settle = useCallback(
    (target: number) => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      targetRef.current = target;
      setSelected(indexAt(target));

      /* Exponential ease-out rather than a spring: these cards are heavy with
         photography and an overshoot reads as a wobble, not as weight. */
      const step = () => {
        const remaining = target - posRef.current;
        if (Math.abs(remaining) < 0.0004) {
          posRef.current = target;
          paint();
          rafRef.current = null;
          return;
        }
        posRef.current += remaining * 0.16;
        paint();
        rafRef.current = requestAnimationFrame(step);
      };
      rafRef.current = requestAnimationFrame(step);
    },
    [indexAt, paint],
  );

  const goTo = useCallback(
    (index: number) => {
      /* The shorter way round, rather than unwinding the whole ring. */
      const target = loop
        ? index + Math.round((targetRef.current - index) / count) * count
        : index;
      settle(clamp(target));
    },
    [clamp, count, loop, settle],
  );

  const nudge = useCallback(
    (by: number) => settle(clamp(Math.round(targetRef.current) + by)),
    [clamp, settle],
  );

  /* ------------------------------------------------------------- dragging */

  const onPointerDown = (event: React.PointerEvent<HTMLElement>) => {
    if (!ready) return;
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    event.currentTarget.setPointerCapture(event.pointerId);
    targetRef.current = posRef.current;
    dragRef.current = {
      id: event.pointerId,
      x: event.clientX,
      pos: posRef.current,
      v: 0,
      t: performance.now(),
    };
  };

  const onPointerMove = (event: React.PointerEvent<HTMLElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.id !== event.pointerId) return;

    const pitch = widthRef.current * (1 + gap);
    if (!pitch) return;

    const now = performance.now();
    const previous = posRef.current;
    posRef.current = clamp(drag.pos - (event.clientX - drag.x) / pitch);
    /* Cards per second, for the throw. */
    drag.v = ((posRef.current - previous) / Math.max(now - drag.t, 1)) * 1000;
    drag.t = now;

    const index = indexAt(posRef.current);
    if (index !== selected) setSelected(index);
    paint();
  };

  const endDrag = (event: React.PointerEvent<HTMLElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.id !== event.pointerId) return;
    dragRef.current = null;
    /* Let a flick carry, but never more than two cards — past that it stops
       feeling like the row followed the hand. */
    const carried = Math.max(-2, Math.min(2, drag.v * 0.18));
    settle(clamp(Math.round(posRef.current + carried)));
  };

  /* ------------------------------------------------------------ measuring */

  useEffect(() => {
    if (!ready) return;
    const frame = frameRef.current;
    if (!frame) return;

    /* Card width drives pitch, depth and perspective, so it is the only thing
       worth measuring — and only when the box actually changes. */
    const measure = () => {
      const card = cardRefs.current[0];
      if (!card) return;
      widthRef.current = card.offsetWidth;
      paint();
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(frame);
    return () => observer.disconnect();
  }, [paint, ready]);

  useEffect(
    () => () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    },
    [],
  );

  return {
    frameRef,
    cardRefs,
    selected,
    ready,
    goTo,
    nudge,
    dragHandlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp: endDrag,
      onPointerCancel: endDrag,
    },
  };
}
