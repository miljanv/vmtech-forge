"use client";

export function ProductMarquee({ names }: { names: string[] }) {
  if (names.length === 0) return null;
  const loop = [...names, ...names];
  return (
    <div className="site-marquee border-y border-[var(--site-border)] bg-[var(--site-surface)]">
      <div className="site-marquee-track">
        {loop.map((name, index) => (
          <span key={`${name}-${index}`} className="px-8 font-heading text-sm tracking-[0.28em] uppercase">
            {name}
          </span>
        ))}
      </div>
    </div>
  );
}
