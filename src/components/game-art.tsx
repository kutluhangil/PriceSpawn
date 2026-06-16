"use client";

import { useId } from "react";

/**
 * Original spectrum-brand gamepad illustration (SVG) — used for empty states.
 * Hand-built vector art: floating controller with a spectrum glow + orbiting
 * pixel "deal" sparks, on the cinematic dark theme.
 */
export function GameArt({ className = "" }: { className?: string }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg viewBox="0 0 240 180" className={className} role="img" aria-label="Oyun kumandası" fill="none">
      <defs>
        <linearGradient id={`${id}-spec`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ff6b6b" />
          <stop offset="0.3" stopColor="#ffc371" />
          <stop offset="0.55" stopColor="#4ade80" />
          <stop offset="0.78" stopColor="#38bdf8" />
          <stop offset="1" stopColor="#a78bfa" />
        </linearGradient>
        <radialGradient id={`${id}-glow`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#a78bfa" stopOpacity="0.45" />
          <stop offset="1" stopColor="#a78bfa" stopOpacity="0" />
        </radialGradient>
        <filter id={`${id}-soft`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2.2" />
        </filter>
      </defs>

      {/* ambient glow */}
      <ellipse cx="120" cy="96" rx="100" ry="64" fill={`url(#${id}-glow)`} />

      {/* orbiting deal sparks */}
      <g opacity="0.9">
        <rect x="34" y="36" width="7" height="7" rx="1.5" fill="#4ade80" filter={`url(#${id}-soft)`} />
        <rect x="196" y="50" width="6" height="6" rx="1.5" fill="#38bdf8" filter={`url(#${id}-soft)`} />
        <rect x="204" y="118" width="5" height="5" rx="1.5" fill="#ffc371" filter={`url(#${id}-soft)`} />
        <rect x="30" y="120" width="6" height="6" rx="1.5" fill="#ff6b6b" filter={`url(#${id}-soft)`} />
      </g>

      {/* controller body */}
      <g>
        <path
          d="M70 64 h100 c20 0 34 14 40 40 c5 22 -2 34 -16 34 c-12 0 -16 -10 -26 -16 c-7 -4 -14 -4 -28 -4 h-32 c-14 0 -21 0 -28 4 c-10 6 -14 16 -26 16 c-14 0 -21 -12 -16 -34 c6 -26 20 -40 40 -40 Z"
          fill="#161922"
          stroke={`url(#${id}-spec)`}
          strokeWidth="2.5"
        />
        {/* spectrum sheen */}
        <path
          d="M70 64 h100 c20 0 34 14 40 40"
          stroke={`url(#${id}-spec)`}
          strokeWidth="3"
          strokeLinecap="round"
          opacity="0.9"
        />

        {/* d-pad */}
        <g fill="#e8eaf2">
          <rect x="62" y="92" width="22" height="8" rx="2" />
          <rect x="69" y="85" width="8" height="22" rx="2" />
        </g>

        {/* action buttons (spectrum) */}
        <circle cx="158" cy="86" r="5.5" fill="#ff6b6b" />
        <circle cx="172" cy="96" r="5.5" fill="#4ade80" />
        <circle cx="144" cy="96" r="5.5" fill="#38bdf8" />
        <circle cx="158" cy="106" r="5.5" fill="#ffc371" />

        {/* sticks */}
        <circle cx="104" cy="108" r="9" fill="#0a0c12" stroke="#2a2d3a" strokeWidth="2" />
        <circle cx="132" cy="108" r="9" fill="#0a0c12" stroke="#2a2d3a" strokeWidth="2" />
      </g>
    </svg>
  );
}
