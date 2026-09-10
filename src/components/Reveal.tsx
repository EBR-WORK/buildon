"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

const elements = {
  div: motion.div,
  li: motion.li,
  ul: motion.ul,
} as const;

type Props = {
  children: ReactNode;
  /**
   * Which element to render. Cards live in lists, so they must animate as
   * <li> — a wrapping <div> would break the list for screen readers.
   */
  as?: keyof typeof elements;
  /** Applied to the element itself — this replaces a wrapper, it does not add one. */
  className?: string;
  /** Seconds to hold before starting, for staggering neighbouring blocks. */
  delay?: number;
};

/**
 * Rises and fades its content in the first time it scrolls into view.
 *
 * `once` is deliberate: replaying on every pass turns scrolling back up into a
 * distraction. Anyone who has asked for reduced motion gets the plain element
 * with no initial offset at all.
 *
 * The data-reveal hook is what the <noscript> rule in the root layout targets,
 * so the copy is still visible if the script never runs.
 */
export default function Reveal({ children, as = "div", className, delay = 0 }: Props) {
  const reduced = useReducedMotion();

  if (reduced) {
    const Plain = as;
    return <Plain className={className}>{children}</Plain>;
  }

  const Animated = elements[as];

  return (
    <Animated
      data-reveal
      className={className}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15, margin: "0px 0px -8% 0px" }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </Animated>
  );
}
