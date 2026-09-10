import { contact, site } from "@/lib/content";
import { HeadphoneIcon, MailIcon, PinIcon } from "./icons";
import DetailBlock from "./DetailBlock";
import Reveal from "./Reveal";
import SectionHeading from "./SectionHeading";

/**
 * Mirrors buildon.co.in's contact row: a one-third details column beside a
 * two-thirds Google map. The map bleeds to the right edge of the viewport,
 * while the details stay aligned with the page container's left edge.
 */
const details = [
  {
    icon: PinIcon,
    label: contact.labels.address,
    value: site.address.full,
    href: site.mapsUrl,
  },
  {
    icon: MailIcon,
    label: contact.labels.email,
    value: site.email,
    href: `mailto:${site.email}`,
  },
  {
    // The reference marks the phone row with a headset
    icon: HeadphoneIcon,
    label: contact.labels.phone,
    value: site.phoneLine,
    href: site.primaryPhoneHref,
  },
];

export default function ContactDetails() {
  return (
    <section id="contact" className="scroll-mt-28 bg-surface">
      <div className="grid lg:grid-cols-2">
        <div className="section-y">
          {/* The padding lives on this block, not the column, and the cap is
              40rem — half of container-page's 80rem. That makes its content
              edge exactly (50% - 40rem + padding), which is the same value
              container-page resolves to, so this lines up with every other
              section at every width. */}
          <Reveal className="ml-auto w-full max-w-[40rem] px-5 sm:px-7 lg:pr-12 lg:pl-8">
            <SectionHeading title={contact.title} />

            <ul className="mt-8 space-y-6 sm:mt-10">
              {details.map((detail, i) => (
                <Reveal as="li" key={detail.label} delay={i * 0.08}>
                  <DetailBlock
                    label={detail.label}
                    value={detail.value}
                    href={detail.href}
                    icon={detail.icon}
                  />
                </Reveal>
              ))}
            </ul>
          </Reveal>
        </div>

        {/* Same treatment as the enquiry photo: inset and rounded when stacked,
            full-bleed only when it sits beside the details at lg. */}
        <div className="mx-5 mb-16 h-[20rem] overflow-hidden rounded-2xl sm:mx-7 sm:mb-20 sm:h-[24rem] lg:mx-0 lg:mb-0 lg:h-auto lg:min-h-full lg:rounded-none">
          <iframe
            src={site.mapEmbedUrl}
            title={`${site.name} on Google Maps`}
            loading="lazy"
            allowFullScreen
            referrerPolicy="no-referrer-when-downgrade"
            className="size-full min-h-[20rem] border-0"
          />
        </div>
      </div>
    </section>
  );
}
