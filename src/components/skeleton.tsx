export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-shimmer ${className}`} aria-hidden="true" />;
}
