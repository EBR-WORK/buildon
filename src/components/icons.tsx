import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

export function ShieldIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3 5 6v5.5c0 4.2 2.8 7.7 7 9.5 4.2-1.8 7-5.3 7-9.5V6l-7-3Z" />
      <path d="m9.2 11.8 2 2 3.6-3.6" />
    </svg>
  );
}

export function GlobeIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M3.4 9h17.2M3.4 15h17.2" />
      <path d="M12 3c2.4 2.5 3.6 5.5 3.6 9S14.4 18.5 12 21c-2.4-2.5-3.6-5.5-3.6-9S9.6 5.5 12 3Z" />
    </svg>
  );
}

export function NetworkIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="5" r="2.2" />
      <circle cx="5" cy="18" r="2.2" />
      <circle cx="19" cy="18" r="2.2" />
      <path d="M12 7.2v4.3m0 0-5.4 4.6M12 11.5l5.4 4.6" />
    </svg>
  );
}

export function FactoryIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M3 20h18M4 20V10l5 3V10l5 3V6.5h5.5V20" />
      <path d="M8 16h1.5M13 16h1.5M17.5 16H19" />
    </svg>
  );
}

export function QuoteIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M9.5 5.5C6.4 6.9 4.5 9.7 4.5 13v5.5h6.6V12H8c.1-1.8 1-3.1 2.7-4L9.5 5.5Zm10 0c-3.1 1.4-5 4.2-5 7.5v5.5h6.6V12H18c.1-1.8 1-3.1 2.7-4l-1.2-2.5Z" />
    </svg>
  );
}

export function ArrowIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M5 12h13m0 0-5-5m5 5-5 5" />
    </svg>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <svg {...base} strokeWidth={2} {...props}>
      <path d="m5 12.5 4.5 4.5L19 7" />
    </svg>
  );
}

export function PhoneIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M6.2 3.5h3l1.4 3.6-2 1.4a11.4 11.4 0 0 0 5 5l1.4-2 3.6 1.4v3a1.6 1.6 0 0 1-1.8 1.6A15.6 15.6 0 0 1 4.6 5.3 1.6 1.6 0 0 1 6.2 3.5Z" />
    </svg>
  );
}

export function MailIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="3" y="5.5" width="18" height="13" rx="2" />
      <path d="m3.8 7 7.3 5.4a1.5 1.5 0 0 0 1.8 0L20.2 7" />
    </svg>
  );
}

export function PinIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11Z" />
      <circle cx="12" cy="10" r="2.6" />
    </svg>
  );
}

export function MenuIcon(props: IconProps) {
  return (
    <svg {...base} strokeWidth={1.8} {...props}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <svg {...base} strokeWidth={1.8} {...props}>
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

/** buildon.co.in labels the phone row with a headset, not a handset. */
export function HeadphoneIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4.5 15v-3a7.5 7.5 0 0 1 15 0v3" />
      <path d="M4.5 14h1.6a1 1 0 0 1 1 1v3.2a1 1 0 0 1-1 1H6a1.5 1.5 0 0 1-1.5-1.5V14Z" />
      <path d="M19.5 14h-1.6a1 1 0 0 0-1 1v3.2a1 1 0 0 0 1 1h.1a1.5 1.5 0 0 0 1.5-1.5V14Z" />
    </svg>
  );
}

/** A speech bubble with three dots — start a conversation. */
export function ChatIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M20.5 11.5a7.5 7.5 0 0 1-10.9 6.7L4 19.5l1.4-4.4A7.5 7.5 0 1 1 20.5 11.5Z" />
      <path d="M8.75 11.5h.01M12 11.5h.01M15.25 11.5h.01" strokeWidth={2.2} />
    </svg>
  );
}

export function PlayIcon(props: IconProps) {
  return (
    <svg {...base} fill="currentColor" stroke="none" {...props}>
      <path d="M9 6.8v10.4a.6.6 0 0 0 .92.5l8.2-5.2a.6.6 0 0 0 0-1l-8.2-5.2a.6.6 0 0 0-.92.5Z" />
    </svg>
  );
}

/** Rotates 45 degrees to become a close mark when its <details> is open. */
export function SearchIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.6-3.6" />
    </svg>
  );
}

export function ChevronRightIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="m9 5 7 7-7 7" />
    </svg>
  );
}

export function ChevronDownIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="m5 9 7 7 7-7" />
    </svg>
  );
}

export function BellIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.7 21a2 2 0 0 1-3.4 0" />
    </svg>
  );
}

export function PlusIcon(props: IconProps) {
  return (
    <svg {...base} strokeWidth={1.8} {...props}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

/**
 * A PDF file — one document in the catalogue grid.
 *
 * Drawn rather than borrowed: the reference's is a bitmap on a CDN, which
 * breaks the day it moves and is soft at any size it was not exported at.
 *
 * Its own viewBox, portrait like a page, so the proportions do not depend on
 * being placed in a square. The fold is two paths over one another — a light
 * fill, then black at 6% — which keeps the shade related to the page colour
 * instead of being a grey picked by hand.
 *
 * "PDF" is live text in the site's own font, so it sharpens on a retina screen
 * and never arrives as a blurred raster.
 */
export function PdfIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 48 62" fill="none" aria-hidden {...props}>
      <path
        d="M5 1.6h25.4L45 16.2v42.4a2.6 2.6 0 0 1-2.6 2.6H5a2.6 2.6 0 0 1-2.6-2.6V4.2A2.6 2.6 0 0 1 5 1.6Z"
        fill="#c62127"
      />
      <path d="M30.4 1.6 45 16.2H33a2.6 2.6 0 0 1-2.6-2.6Z" fill="#e9ecef" />
      <path d="M30.4 1.6 45 16.2H33a2.6 2.6 0 0 1-2.6-2.6Z" fill="#000" opacity=".06" />
      <text
        x="23.7"
        y="50"
        textAnchor="middle"
        fontSize="13.5"
        fontWeight="700"
        letterSpacing="1"
        fill="#eef0f2"
      >
        PDF
      </text>
    </svg>
  );
}

/**
 * A document wallet — one catalogue in the folder grid.
 *
 * Filled rather than stroked, unlike every other icon in this file: it is
 * drawn at around 96px as the subject of a card, not at 16px beside a label,
 * and a line drawing at that size reads as an outline of a folder instead of a
 * folder. It takes no `stroke`, so it ignores `currentColor` on purpose.
 */
export function FolderIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 64 56" fill="none" aria-hidden {...props}>
      {/* Back of the wallet, with its tab */}
      <path
        d="M4 10a4 4 0 0 1 4-4h14.3c1.1 0 2.1.4 2.9 1.2L29 11h27a4 4 0 0 1 4 4v33a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V10Z"
        fill="#E9A800"
      />
      {/* The sheets inside, fanned so the stack reads as paper */}
      <rect x="13" y="15" width="38" height="26" rx="2" fill="#F4F6F8" />
      <rect x="13" y="18.5" width="38" height="3" fill="#D64545" />
      <rect x="13" y="22" width="38" height="3" fill="#3C72C4" />
      <rect x="13" y="25.5" width="38" height="3" fill="#3F9E68" />
      {/* Front flap, lighter so the wallet looks open */}
      <path d="M4 24h56v24a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V24Z" fill="#FFC400" />
      {/* The written label */}
      <rect x="20" y="30" width="24" height="7" rx="1.5" fill="#FFFFFF" opacity="0.9" />
    </svg>
  );
}

/** An open eye — the password is showing. */
export function EyeIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="3.2" />
    </svg>
  );
}

/** The same eye, struck through — the password is hidden. */
export function EyeOffIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M9.9 5.8A8.8 8.8 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a16.6 16.6 0 0 1-2.9 3.6" />
      <path d="M6.4 7.6A16.4 16.4 0 0 0 2.5 12S6 18.5 12 18.5c1.4 0 2.6-.3 3.7-.8" />
      <path d="M10.1 10.1a2.7 2.7 0 0 0 3.8 3.8" />
      <path d="m4 4 16 16" />
    </svg>
  );
}

/** An arrow into a tray — download. */
export function DownloadIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3.5v11" />
      <path d="m7.5 10.5 4.5 4 4.5-4" />
      <path d="M4.5 16.5v2a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-2" />
    </svg>
  );
}

/** A paper plane — send. */
export function SendIcon(props: IconProps) {
  return (
    <svg {...base} strokeWidth={1.8} {...props}>
      <path d="M21.5 2.5 11 13M21.5 2.5l-6.8 19-3.9-8.5-8.5-3.9 19-6.6Z" />
    </svg>
  );
}

/** Stacked photographs — the media gallery. */
export function ImagesIcon(props: IconProps) {
  return (
    <svg {...base} strokeWidth={1.8} {...props}>
      <rect x="3" y="7" width="14" height="12" rx="2" />
      <path d="M7 7V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-2" />
      <circle cx="7.5" cy="11.5" r="1.2" />
      <path d="m3.5 17 4-4 3.5 3.5 2.5-2 3.5 3.5" />
    </svg>
  );
}

/** A waste basket — delete. Stroked like the rest, not filled: it sits beside
    Edit in the admin rows and should read as one of a set, not as an alarm. */
export function TrashIcon(props: IconProps) {
  return (
    <svg {...base} strokeWidth={1.8} {...props}>
      <path d="M4 7h16M10 11v6M14 11v6M5 7l1 13h12l1-13M9 7V4h6v3" />
    </svg>
  );
}

/** A pencil — edit. */
export function PencilIcon(props: IconProps) {
  return (
    <svg {...base} strokeWidth={1.8} {...props}>
      <path d="M4 20h4L19 9a2.5 2.5 0 0 0-3.5-3.5L4.5 16.5 4 20Z" />
    </svg>
  );
}

/** An exclamation in a circle — the confirmation toast's mark. */
export function AlertIcon(props: IconProps) {
  return (
    <svg {...base} strokeWidth={1.8} {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5v5.5M12 16.2v.3" />
    </svg>
  );
}

/** Four corner arrows pointing out — enters fullscreen. */
export function ExpandIcon(props: IconProps) {
  return (
    <svg {...base} strokeWidth={1.8} {...props}>
      <path d="M9 4H4v5M15 4h5v5M15 20h5v-5M9 20H4v-5" />
    </svg>
  );
}

/** The same arrows pointing in — leaves fullscreen. */
export function CollapseIcon(props: IconProps) {
  return (
    <svg {...base} strokeWidth={1.8} {...props}>
      <path d="M4 9h5V4M20 9h-5V4M20 15h-5v5M4 15h5v5" />
    </svg>
  );
}

/* Social marks are brand glyphs, so they are filled rather than stroked. */
const solid = { viewBox: "0 0 24 24", fill: "currentColor", "aria-hidden": true } as const;

/*
 * The four brand marks below are each wrapped in a transform that normalises
 * them, and the numbers are measured rather than chosen: every one was
 * rendered and its bounding box read off the pixels.
 *
 *   mark       drawn as        filled        now
 *   youtube    20.0 x 14.0     83% x 58%     19.0 x 13.3
 *   facebook    8.1 x 15.4     34% x 64%      8.9 x 17.0
 *   instagram  19.7 x 19.7     83% x 83%     17.0 x 17.0
 *   linkedin   16.3 x 18.0     68% x 75%     15.3 x 17.0
 *
 * Which is the whole problem: drawn as they came, Instagram was two and a half
 * times the width of Facebook in the same circle, and each sat wherever its
 * path happened to put it rather than in the middle.
 *
 * Each is now fitted into 19 wide by 17 tall, keeping its own proportions, and
 * centred on 12,12. Height is what carries, except for YouTube — a play button
 * is a wide rectangle, and forcing it to the same height as the others would
 * make it the widest thing in the row by far.
 */
export function YoutubeIcon(props: IconProps) {
  return (
    <svg {...solid} {...props}>
      <g transform="translate(0.6 0.6) scale(0.95)">
        <path
          fillRule="evenodd"
          d="M21.58 7.19a2.5 2.5 0 0 0-1.77-1.77C18.25 5 12 5 12 5s-6.25 0-7.81.42a2.5 2.5 0 0 0-1.77 1.77A26 26 0 0 0 2 12a26 26 0 0 0 .42 4.81 2.5 2.5 0 0 0 1.77 1.77C5.75 19 12 19 12 19s6.25 0 7.81-.42a2.5 2.5 0 0 0 1.77-1.77A26 26 0 0 0 22 12a26 26 0 0 0-.42-4.81ZM10 15.02V8.98L15.2 12 10 15.02Z"
        />
      </g>
    </svg>
  );
}

export function FacebookIcon(props: IconProps) {
  return (
    <svg {...solid} {...props}>
      <g transform="translate(-3.372 -2.682) scale(1.1039)">
        <path d="M15.12 21v-7.02h2.36l.35-2.74h-2.71V9.5c0-.79.22-1.33 1.36-1.33h1.45V5.72c-.25-.03-1.11-.11-2.11-.11-2.09 0-3.52 1.27-3.52 3.62v2.01H9.93v2.74h2.37V21h2.82Z" />
      </g>
    </svg>
  );
}

export function InstagramIcon(props: IconProps) {
  return (
    <svg {...solid} {...props}>
      <g transform="translate(1.645 1.645) scale(0.8629)">
        <path
          fillRule="evenodd"
          d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.7 3.7 0 0 1-1.38-.9 3.7 3.7 0 0 1-.9-1.38c-.16-.42-.36-1.06-.41-2.23C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.17 8.8 2.16 12 2.16Zm0 5.68a4.16 4.16 0 1 0 0 8.32 4.16 4.16 0 0 0 0-8.32Zm0 6.86a2.7 2.7 0 1 1 0-5.4 2.7 2.7 0 0 1 0 5.4Zm5.3-7.02a.97.97 0 1 1-1.94 0 .97.97 0 0 1 1.94 0Z"
        />
      </g>
    </svg>
  );
}

export function LinkedinIcon(props: IconProps) {
  return (
    <svg {...solid} {...props}>
      <g transform="translate(0.785 0.667) scale(0.9444)">
        <path d="M6.94 8.4H4.06V21h2.88V8.4ZM5.5 3a1.72 1.72 0 1 0 0 3.44A1.72 1.72 0 0 0 5.5 3ZM20 13.9c0-3.05-1.63-4.47-3.8-4.47-1.75 0-2.54.96-2.98 1.64V8.4H10.3c.04.85 0 12.6 0 12.6h2.92v-7.04c0-.26.02-.52.1-.71.2-.53.68-1.07 1.48-1.07 1.05 0 1.46.8 1.46 1.96V21H20v-7.1Z" />
      </g>
    </svg>
  );
}

export const socialIcons = {
  youtube: YoutubeIcon,
  facebook: FacebookIcon,
  instagram: InstagramIcon,
  linkedin: LinkedinIcon,
} as const;

export const featureIcons = {
  shield: ShieldIcon,
  globe: GlobeIcon,
  network: NetworkIcon,
  factory: FactoryIcon,
} as const;
