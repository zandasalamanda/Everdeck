import { useId } from "react";

/**
 * Everdeck mark: a hand of three cards fanned from a face-down stack.
 * Monochrome by default (inherits currentColor); `gradient` fills the
 * front card with the brand's iridescent gradient.
 */
export default function Logo({
  className,
  gradient = false,
}: {
  className?: string;
  gradient?: boolean;
}) {
  const id = useId().replace(/:/g, "");

  return (
    <svg
      viewBox="0 0 256 256"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {gradient && (
        <defs>
          <linearGradient id={id} x1="0" y1="1" x2="1" y2="0">
            <stop offset="0" stopColor="#FFC2D4" />
            <stop offset="0.38" stopColor="#C9BBFF" />
            <stop offset="0.72" stopColor="#9CD6FF" />
            <stop offset="1" stopColor="#B5F5D8" />
          </linearGradient>
        </defs>
      )}
      <rect
        x="70"
        y="52"
        width="116"
        height="164"
        rx="22"
        fill="currentColor"
        opacity="0.4"
        transform="rotate(-19 128 228)"
      />
      <rect
        x="70"
        y="52"
        width="116"
        height="164"
        rx="22"
        fill="currentColor"
        opacity="0.4"
        transform="rotate(19 128 228)"
      />
      <rect
        x="70"
        y="40"
        width="116"
        height="164"
        rx="22"
        fill={gradient ? `url(#${id})` : "currentColor"}
      />
    </svg>
  );
}
