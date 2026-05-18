/**
 * Simple SVG-Bar-Chart, ohne externe Library.
 *
 * X-Achsen-Labels werden als HTML *unter* der SVG gerendert (nicht als
 * <text> innerhalb), weil das SVG mit preserveAspectRatio="none"
 * horizontal gestreckt wird — was Text-Inhalte ebenfalls verzerrt
 * (siehe vorheriges UI-Issue). HTML-Labels behalten ihre Schrift-
 * Proportionen.
 */
export default function SparkBars({
  data,
  height = 120,
  valueFmt = (n: number) => String(n),
}: {
  data: { label: string; value: number }[];
  height?: number;
  valueFmt?: (n: number) => string;
}) {
  if (data.length === 0) {
    return <p className="text-sm text-on-surface-variant py-4">Keine Daten.</p>;
  }
  const max = Math.max(...data.map((d) => d.value), 1);
  const barWidth = 100 / data.length;
  const gap = barWidth * 0.18;

  return (
    <div>
      <svg
        viewBox={`0 0 100 ${height}`}
        preserveAspectRatio="none"
        className="w-full"
        style={{ height }}
        role="img"
      >
        {data.map((d, i) => {
          const h = (d.value / max) * height;
          const x = i * barWidth + gap / 2;
          const w = barWidth - gap;
          const y = height - h;
          return (
            <rect
              key={i}
              x={x}
              y={y}
              width={w}
              height={h}
              fill="currentColor"
              className="text-tertiary"
            >
              <title>
                {d.label}: {valueFmt(d.value)}
              </title>
            </rect>
          );
        })}
      </svg>
      {/* X-Achsen-Labels als HTML — gleichbreite Spalten parallel zu den Bars. */}
      <div className="flex mt-1.5">
        {data.map((d, i) => (
          <div
            key={i}
            className="flex-1 text-center font-headline text-[10px] uppercase tracking-wider text-on-surface-variant truncate px-0.5"
            title={`${d.label}: ${valueFmt(d.value)}`}
          >
            {d.label}
          </div>
        ))}
      </div>
      <div className="flex justify-between mt-2 text-[10px] text-on-surface-variant font-mono">
        <span>0</span>
        <span>Max: {valueFmt(max)}</span>
      </div>
    </div>
  );
}
