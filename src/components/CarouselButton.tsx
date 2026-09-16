import { ArrowIcon } from "./icons";

type Props = {
  direction: "prev" | "next";
  label: string;
  onClick: () => void;
  disabled?: boolean;
  /** Extra classes, such as positioning. The colours live here, not per carousel. */
  className?: string;
};

/**
 * The round arrow control shared by the product and testimonial carousels.
 *
 * The look is defined once, here, so both carousels always match: white with a
 * hairline border at rest, turning skin-blue with a white arrow on hover.
 * Hover styles apply only while enabled — a faded, disabled arrow that lit up
 * blue under the cursor read as clickable when it was not.
 */
export default function CarouselButton({
  direction,
  label,
  onClick,
  disabled,
  className = "",
}: Props) {
  return (
    <button
      suppressHydrationWarning
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={`inline-flex size-11 cursor-pointer items-center justify-center rounded-full border border-line bg-white text-ink-700 transition enabled:hover:border-brand-500 enabled:hover:bg-brand-500 enabled:hover:text-white disabled:cursor-default disabled:opacity-30 ${className}`}
    >
      <ArrowIcon className={`size-5 ${direction === "prev" ? "rotate-180" : ""}`} />
    </button>
  );
}
