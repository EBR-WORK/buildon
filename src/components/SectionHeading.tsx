import { Fragment } from "react";

type Props = {
  /**
   * A string, or the lines of a heading that buildon.co.in breaks with a <br>
   * inside a single h2 — "Here's Who We Are:" over "About Us", for instance.
   */
  title: string | readonly string[];
  /** Same deal as `title`: an array is rendered as lines split by <br>. */
  intro?: string | readonly string[];
  align?: "left" | "center";
  tone?: "light" | "dark";
  id?: string;
};

/** Renders one string as-is, or several as lines separated by <br>. */
function lineBreaks(value: string | readonly string[]) {
  const lines = typeof value === "string" ? [value] : value;
  return lines.map((line, i) => (
    <Fragment key={line}>
      {i > 0 && <br />}
      {line}
    </Fragment>
  ));
}

export default function SectionHeading({
  title,
  intro,
  align = "left",
  tone = "light",
  id,
}: Props) {
  const centered = align === "center";
  const dark = tone === "dark";
  return (
    <div className={`max-w-2xl ${centered ? "mx-auto text-center" : ""}`}>
      <h2
        id={id}
        className={`text-[clamp(1.6rem,2.2vw+0.65rem,2.2rem)] leading-[1.15] font-semibold ${
          dark ? "text-white" : ""
        }`}
      >
        {lineBreaks(title)}
      </h2>
      {intro && (
        <p
          className={`mt-3.5 text-base leading-relaxed sm:mt-4 ${
            dark ? "text-white/70" : "text-ink-500"
          }`}
        >
          {lineBreaks(intro)}
        </p>
      )}
    </div>
  );
}
