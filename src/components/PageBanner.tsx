import Image from "next/image";

type Props = {
  image: string;
  /** One line per rendered row, as the reference breaks these headings. */
  headingLines: readonly string[];
  subheadingLines?: readonly string[];
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
export default function PageBanner({ image, headingLines, subheadingLines }: Props) {
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

      <div className="container-page flex min-h-[16rem] flex-col justify-center py-14 sm:min-h-[20rem] lg:min-h-[28rem] lg:py-16">
        <h1 className="font-display text-[clamp(1.75rem,2vw+1rem,2.5rem)] leading-[1.25] font-medium tracking-wide text-white uppercase">
          {headingLines.map((line) => (
            <span key={line} className="block">
              {line}
            </span>
          ))}
        </h1>

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
