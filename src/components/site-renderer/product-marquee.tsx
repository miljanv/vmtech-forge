"use client";

export function ProductMarquee({ names }: { names: string[] }) {
  if (names.length === 0) return null;
  const loop = [...names, ...names];
  return (
    <div className="site-marquee border-y border-[var(--site-border)]">
      <div className="site-marquee-track">
        {loop.map((name, index) => (
          <span
            key={`${name}-${index}`}
            className="flex items-center gap-8 px-5 text-[11px] tracking-[0.34em] uppercase"
          >
            <span className="text-[var(--site-fg)]/30">✳</span>
            {name}
          </span>
        ))}
      </div>
    </div>
  );
}
