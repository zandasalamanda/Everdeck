import { useReveal } from "../lib/useReveal";

export default function SectionHeading({
  eyebrow,
  title,
  sub,
  dark = false,
}: {
  eyebrow: string;
  title: string;
  sub?: string;
  dark?: boolean;
}) {
  const ref = useReveal<HTMLDivElement>();

  return (
    <div ref={ref} className="reveal mx-auto max-w-2xl text-center">
      <p
        className={`inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.22em] ${
          dark ? "text-white/60" : "text-slate"
        }`}
      >
        <span className="bg-iridescent h-[2px] w-6 rounded-full" />
        {eyebrow}
        <span className="bg-iridescent h-[2px] w-6 rounded-full" />
      </p>
      <h2
        className={`mt-3 text-3xl sm:text-4xl lg:text-[44px] font-normal leading-[1.1] tracking-tight ${
          dark ? "text-white" : "text-ink"
        }`}
      >
        {title}
      </h2>
      {sub && (
        <p
          className={`mt-4 text-sm sm:text-base leading-relaxed ${
            dark ? "text-white/60" : "text-slate"
          }`}
        >
          {sub}
        </p>
      )}
    </div>
  );
}
