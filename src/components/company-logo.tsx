import type { Company } from "@/data/companies";

/** Initials fallback for companies without an official SVG glyph. */
function monogram(name: string): string {
  const stop = new Set(["games", "interactive", "studios", "studio", "entertainment", "the", "bit", "of"]);
  const words = name
    .replace(/[().]/g, " ")
    .split(/\s+/)
    .filter((w) => w && !stop.has(w.toLowerCase()));
  const letters = (words.length ? words : name.split(/\s+/)).map((w) => w[0]);
  return letters.slice(0, 2).join("").toUpperCase();
}

/**
 * Company glyph. Official SVG (simple-icons) is rendered via CSS mask so it
 * inherits `currentColor` and can be tinted per-tile; companies without a glyph
 * get a designed monogram in the brand accent.
 */
export function CompanyLogo({ company, size = 48 }: { company: Company; size?: number }) {
  if (company.logo) {
    const url = `url(/logos/${company.logo}.svg)`;
    return (
      <span
        aria-hidden="true"
        style={{
          display: "inline-block",
          width: size,
          height: size,
          backgroundColor: "currentColor",
          WebkitMaskImage: url,
          maskImage: url,
          WebkitMaskRepeat: "no-repeat",
          maskRepeat: "no-repeat",
          WebkitMaskPosition: "center",
          maskPosition: "center",
          WebkitMaskSize: "contain",
          maskSize: "contain",
        }}
      />
    );
  }
  return (
    <span
      aria-hidden="true"
      className="grid place-items-center rounded-2xl font-display font-black leading-none tracking-tight"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.42,
        color: company.accent,
        background: `linear-gradient(140deg, ${company.accent}26, ${company.accent}0d)`,
        border: `1px solid ${company.accent}40`,
      }}
    >
      {monogram(company.name)}
    </span>
  );
}
