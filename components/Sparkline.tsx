import { formatListeners } from "@/lib/bands";

export function Sparkline({
  points,
  color = "#e8b64c",
  height = 160,
}: {
  points: { date: string; value: number }[];
  color?: string;
  height?: number;
}) {
  if (points.length < 2) return null;

  const w = 600;
  const h = height;
  const pad = { top: 14, right: 8, bottom: 18, left: 8 };
  const values = points.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;

  const x = (i: number) =>
    pad.left + (i / (points.length - 1)) * (w - pad.left - pad.right);
  const y = (v: number) =>
    pad.top + (1 - (v - min) / span) * (h - pad.top - pad.bottom);

  const line = points.map((p, i) => `${i === 0 ? "M" : "L"} ${x(i).toFixed(1)} ${y(p.value).toFixed(1)}`).join(" ");
  const area = `${line} L ${x(points.length - 1).toFixed(1)} ${h - pad.bottom} L ${x(0).toFixed(1)} ${h - pad.bottom} Z`;

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full" role="img" aria-label="Monthly listeners since backing">
        <defs>
          <linearGradient id="spark-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.28" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#spark-fill)" />
        <path d={line} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        <circle cx={x(points.length - 1)} cy={y(points[points.length - 1].value)} r="4" fill={color} />
        <circle cx={x(0)} cy={y(points[0].value)} r="3" fill="#5c5c68" />
      </svg>
      <div className="flex justify-between px-1 font-mono text-[11px] text-faint">
        <span>{formatListeners(points[0].value)}</span>
        <span>{formatListeners(points[points.length - 1].value)}</span>
      </div>
    </div>
  );
}
