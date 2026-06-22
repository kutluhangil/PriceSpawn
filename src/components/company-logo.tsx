import type { Company } from "@/data/companies";

/**
 * Real, full-colour official logo shown as-is (no tint, no mask, original
 * proportions on transparent bg). The three companies without a usable official
 * logo file fall back to a clean wordmark of the real name (brand accent),
 * never an invented glyph.
 */
export function CompanyLogo({
  company,
  className = "",
  onLightSurface = false,
}: {
  company: Company;
  className?: string;
  /** True when rendered on a light chip (e.g. modal) → skip the dark-tile invert. */
  onLightSurface?: boolean;
}) {
  if (company.logo) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={`/logos/${company.logo}`}
        alt={`${company.name} logo`}
        loading="lazy"
        className={`max-h-full max-w-full object-contain ${
          company.lightLogo && !onLightSurface ? "logo-invert-dark" : ""
        } ${className}`}
      />
    );
  }
  return (
    <span
      className={`font-display text-center font-extrabold leading-tight tracking-tight ${className}`}
      style={{ color: company.accent }}
    >
      {company.name}
    </span>
  );
}
