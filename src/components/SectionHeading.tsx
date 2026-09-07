import { Fragment } from "react";

type Props = {
  /**
   * A string, or the lines of a heading that buildon.co.in breaks with a <br>
   * inside a single h2 — "Here's Who We Are:" over "About Us", for instance.
   */
  title: string | readonly string[];
  intro?: string;
  align?: "left" | "center";
  tone?: "light" | "dark";
  id?: string;
};

export default function SectionHeading({
  title,
  intro,
  align = "left",
  tone = "light",
  id,
}: Props) {
  const centered = align === "center";
  const dark = tone === "dark";
  const lines = typeof title === "string" ? [title] : title;

  return (
    <div className={`max-w-2xl ${centered ? "mx-auto text-center" : ""}`}>
      <h2
        id={id}
        className={`text-[clamp(1.6rem,2.2vw+0.65rem,2.2rem)] leading-[1.15] font-semibold ${
          dark ? "text-white" : ""
        }`}
      >
        {lines.map((line, i) => (
          <Fragment key={line}>
            {i > 0 && <br />}
            {line}
          </Fragment>
        ))}
      </h2>
      {intro && (
        <p
          className={`mt-3.5 text-base leading-relaxed sm:mt-4 ${
            dark ? "text-white/70" : "text-ink-500"
          }`}
        >
          {intro}
        </p>
      )}
    </div>
  );
}
