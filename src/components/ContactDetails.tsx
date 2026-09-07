import { contact, site } from "@/lib/content";
import { HeadphoneIcon, MailIcon, PinIcon } from "./icons";

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
    <section id="contact" className="scroll-mt-24 bg-surface">
      <div className="grid lg:grid-cols-2">
        <div className="section-y pr-5 pl-5 sm:pr-7 sm:pl-7 lg:pr-12 lg:pl-8">
          {/* max-w 38rem = half the 80rem container minus its 2rem gutter, so
              this content lines up with every other section's left edge */}
          <div className="ml-auto w-full max-w-[38rem]">
            <h2 className="text-[clamp(1.6rem,2.2vw+0.65rem,2.2rem)] leading-[1.15] font-semibold">
              {contact.title}
            </h2>

            <ul className="mt-8 sm:mt-10">
              {details.map((detail) => (
                <li
                  key={detail.label}
                  className="relative flex gap-4 border-b border-line py-6 after:absolute after:-bottom-px after:left-0 after:h-0.5 after:w-7 after:bg-brand-600 after:content-['']"
                >
                  <detail.icon className="mt-0.5 size-6 shrink-0 text-brand-500" />
                  <div className="min-w-0">
                    <h3 className="text-lg font-semibold">{detail.label}</h3>
                    <a
                      href={detail.href}
                      className="mt-1.5 block leading-[25px] text-ink-500 transition hover:text-brand-500"
                    >
                      {detail.value}
                    </a>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="min-h-[20rem] lg:min-h-full">
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
