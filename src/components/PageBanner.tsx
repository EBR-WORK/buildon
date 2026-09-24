import Image from "next/image";

type Props = {
  image: string;
  /** One line per rendered row, as the reference breaks these headings. */
  headingLines: readonly string[];
  subheadingLines?: readonly string[];
  /**
   * The lighter line the product banners set ABOVE their title — "A coat of
   * beauty to your dream." over "GYPSUM PLASTER 1 COAT." `subheadingLines`
   * stays what it was: the line below, used by /faq.
   */
  eyebrow?: string;
  /**
   * Washes the artwork so white type stays legible. The nine product banners
   * do not agree on a panel colour — measured over the text area they run from
   * luminance 69 (master plaster, near black) to 211 (P-20, almost white) — so
   * the strength is chosen per artwork rather than fixed: "strong" rescues the
   * pale ones, "light" leaves an already-dark panel its colour.
   */
  scrim?: "none" | "light" | "strong";
  /**
   * Keeps the heading inside the artwork's colour panel. Implied by `eyebrow`
   * or a scrim; set it where neither applies — the product banners carry no
   * wash, and Classic has no eyebrow, so uncapped its title ran out over the
   * white half of the picture.
   */
  narrowHeading?: boolean;
};

/**
 * The title bar shared by every inner page.
 *
 * The height is fixed rather than derived from each artwork's ratio, so every
 * page opens at the same size. 28rem matches what the 1718x562 FAQ artwork
 * renders at around a 1360px viewport — near enough to show that one whole —
 * and holds steady on wider screens instead of growing with them. The 1920x400
 * banners are far wider than this box, so object-cover trims their sides.
 */
export default function PageBanner({
  image,
  headingLines,
  subheadingLines,
  eyebrow,
  scrim = "none",
  narrowHeading = false,
}: Props) {
  return (
    <section className="relative isolate overflow-hidden bg-secondary">
      <Image
        src={image}
        alt=""
        fill
        sizes="100vw"
        priority
        className="-z-10 object-cover object-[20%_center] sm:object-center"
      />
      {/* Each artwork carries its heading on a solid blue panel, so no wash is
          needed once that panel is in frame. Below sm, object-cover crops it
          away and the heading would land on the bright half — hence sm:hidden. */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-linear-to-r from-secondary/75 via-secondary/35 to-transparent sm:hidden"
      />

      {/* Stops chosen against the lightest artwork: white on the resulting
          tone clears 4.5:1 across the whole width the heading can occupy. */}
      {scrim !== "none" && (
        <div
          aria-hidden
          className={`absolute inset-0 -z-10 hidden to-transparent to-60% sm:block ${
            scrim === "strong"
              ? "bg-linear-to-r from-secondary/85 from-0% via-secondary/60 via-45%"
              : "bg-linear-to-r from-secondary/45 from-0% via-secondary/25 via-45%"
          }`}
        />
      )}

      <div className="container-page flex min-h-[16rem] flex-col justify-center py-14 sm:min-h-[20rem] lg:min-h-[28rem] lg:py-16">
        {/* The product banners set the eyebrow at the same size as the title,
            so the two read as one block of caps inside the artwork's colour
            panel — hence the width cap, which is what makes it wrap there
            rather than running across the photograph. It applies to every
            product banner, eyebrow or not: Classic has none, and uncapped its
            title ran out over the white half of the picture. */}
        <div
          className={
            eyebrow || scrim !== "none" || narrowHeading
              ? "max-w-[19rem] sm:max-w-[26rem]"
              : undefined
          }
        >
          {eyebrow && (
            <p className="mb-1 font-display text-[clamp(1.75rem,2vw+1rem,2.5rem)] leading-[1.25] font-normal tracking-wide text-white uppercase sm:mb-2">
              {eyebrow}
            </p>
          )}

          <h1 className="font-display text-[clamp(1.75rem,2vw+1rem,2.5rem)] leading-[1.25] font-medium tracking-wide text-white uppercase">
            {headingLines.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </h1>
        </div>

        {subheadingLines && (
          <p className="mt-3 max-w-md font-display text-lg leading-snug font-medium text-white/85 sm:text-xl">
            {subheadingLines.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </p>
        )}
      </div>
    </section>
  );
}
