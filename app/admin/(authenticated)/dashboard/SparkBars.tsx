/**
 * Simple SVG-Bar-Chart, ohne externe Library. Keine Interaktion —
 * pure Sichtkontrolle. Bars sind hover-tooltip-faehig via <title>.
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
    return (
      <p className="text-sm text-on-surface-variant py-4">Keine Daten.</p>
    );
  }
  const max = Math.max(...data.map((d) => d.value), 1);
  const barWidth = 100 / data.length;
  const gap = barWidth * 0.18;
  return (
    <div>
      <svg viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" className="w-full" style={{ height }}>
        {data.map((d, i) => {
          const h = (d.value / max) * (height - 20);
          const x = i * barWidth + gap / 2;
          const w = barWidth - gap;
          const y = height - 16 - h;
          return (
            <g key={i}>
              <rect
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
              <text
                x={x + w / 2}
                y={height - 4}
                textAnchor="middle"
                fontSize="6"
                fill="currentColor"
                className="text-on-surface-variant"
              >
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="flex justify-between mt-1 text-[10px] text-on-surface-variant font-mono">
        <span>0</span>
        <span>Max: {valueFmt(max)}</span>
      </div>
    </div>
  );
}
