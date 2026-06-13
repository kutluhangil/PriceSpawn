"use client";

import Image from "next/image";
import { useState } from "react";

const FALLBACK_GRADIENTS = [
  "linear-gradient(135deg, #6d28d9, #db2777)",
  "linear-gradient(135deg, #0891b2, #6d28d9)",
  "linear-gradient(135deg, #db2777, #f59e0b)",
  "linear-gradient(135deg, #059669, #0891b2)",
  "linear-gradient(135deg, #4f46e5, #0ea5e9)",
];

function gradientFor(title: string): string {
  let hash = 0;
  for (let i = 0; i < title.length; i++) hash = (hash * 31 + title.charCodeAt(i)) | 0;
  return FALLBACK_GRADIENTS[Math.abs(hash) % FALLBACK_GRADIENTS.length];
}

export function CoverImage({
  src,
  title,
  className = "",
  sizes = "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 280px",
  quality,
}: {
  src: string;
  title: string;
  className?: string;
  sizes?: string;
  quality?: number;
}) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  if (!src || failed) {
    return (
      <div
        className={`flex items-center justify-center ${className}`}
        style={{ background: gradientFor(title) }}
      >
        <span className="text-center text-sm font-bold text-white/90 px-4 leading-snug">
          {title}
        </span>
      </div>
    );
  }

  return (
    <span className={`relative block overflow-hidden ${className}`}>
      {!loaded && <span className="animate-shimmer absolute inset-0" aria-hidden="true" />}
      <Image
        src={src}
        alt={title}
        fill
        sizes={sizes}
        quality={quality}
        unoptimized={src.endsWith(".webm")}
        onError={() => setFailed(true)}
        onLoad={() => setLoaded(true)}
        className={`object-cover transition-opacity duration-300 ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
      />
    </span>
  );
}
