import type { ComponentType, SVGProps } from "react";

type Props = {
  label: string;
  value: string;
  /** Renders the value as a link — used for addresses, emails and phone numbers. */
  href?: string;
  icon?: ComponentType<SVGProps<SVGSVGElement>>;
};

/**
 * The label-over-value block buildon.co.in repeats across its contact pages:
 * a bold Oswald label, the value beneath in body grey, and a hairline rule
 * carrying a short skin-colour tick at its left end.
 */
export default function DetailBlock({ label, value, href, icon: Icon }: Props) {
  const body = (
    <div className="min-w-0">
      <h3 className="font-display text-lg leading-snug font-semibold">{label}</h3>
      {href ? (
        <a
          href={href}
          className="mt-1.5 block leading-[25px] text-ink-500 transition hover:text-brand-500"
        >
          {value}
        </a>
      ) : (
        <p className="mt-1.5 leading-[25px] text-ink-500">{value}</p>
      )}
    </div>
  );

  return (
    <div className="relative border-b border-line pb-5 after:absolute after:-bottom-px after:left-0 after:h-0.5 after:w-7 after:bg-brand-600 after:content-['']">
      {Icon ? (
        <div className="flex gap-4">
          <Icon className="mt-0.5 size-6 shrink-0 text-brand-500" />
          {body}
        </div>
      ) : (
        body
      )}
    </div>
  );
}
