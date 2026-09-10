import { ArrowIcon } from "./icons";

type Props = {
  direction: "prev" | "next";
  label: string;
  onClick: () => void;
  disabled?: boolean;
  /** Positioning and colour, so each carousel can place its own controls. */
  className?: string;
};

/** The round arrow control shared by the product and testimonial carousels. */
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
      className={`inline-flex size-11 items-center justify-center rounded-full transition disabled:opacity-30 ${className}`}
    >
      <ArrowIcon className={`size-5 ${direction === "prev" ? "rotate-180" : ""}`} />
    </button>
  );
}
