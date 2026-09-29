import type { Metadata } from "next";
import CityLanding, { cityMetadata } from "@/components/CityLanding";

/* Its own route so no dynamic segment sits at the app root catching unknown
   paths; the page itself is CityLanding. */
const SLUG = "gypsum-plaster-in-jamshedpur";

export const metadata: Metadata = cityMetadata(SLUG);

export default function Page() {
  return <CityLanding slug={SLUG} />;
}
