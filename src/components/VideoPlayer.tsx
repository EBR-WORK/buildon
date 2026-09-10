"use client";

import { useRef, useState } from "react";
import { PlayIcon } from "./icons";

type Props = {
  src: string;
  poster: string;
  label: string;
  className?: string;
};

/**
 * The reference site drives this video with Plyr. Rather than pull in a player
 * library for one clip, this keeps the browser's own controls and adds the part
 * that actually reads as Plyr: the poster sits behind a large round play button
 * until someone starts the video.
 *
 * Nothing but the poster is fetched until then (`preload="none"`), and the
 * native controls stay on from the first play so pausing does not hide them.
 */
export default function VideoPlayer({ src, poster, label, className = "" }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [started, setStarted] = useState(false);

  return (
    <div className={`relative overflow-hidden rounded-2xl bg-black shadow-card ${className}`}>
      <video
        ref={videoRef}
        poster={poster}
        preload="none"
        playsInline
        controls={started}
        onPlay={() => setStarted(true)}
        className="aspect-video w-full object-contain"
      >
        <source src={src} type="video/mp4" />
      </video>

      {!started && (
        <button
          suppressHydrationWarning
          type="button"
          onClick={() => videoRef.current?.play()}
          className="group absolute inset-0 grid cursor-pointer place-items-center"
        >
          <span className="grid size-14 place-items-center rounded-full bg-brand-500 text-white shadow-lift transition group-hover:scale-105 group-hover:bg-brand-600 sm:size-16">
            <PlayIcon className="size-6 sm:size-7" />
          </span>
          <span className="sr-only">{label}</span>
        </button>
      )}
    </div>
  );
}
