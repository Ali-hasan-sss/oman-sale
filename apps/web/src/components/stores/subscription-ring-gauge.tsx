'use client';

type SubscriptionRingGaugeProps = {
  title: string;
  used: number;
  total: number;
  usedLabel: string;
  remainingLabel: string;
  centerValue: string;
  centerSub?: string;
  accentColor?: string;
};

const SIZE = 88;
const OUTER_RADIUS = 38;
const INNER_RADIUS = 30;
const OUTER_STROKE = 5;
const INNER_STROKE = 6;

function ringCircumference(radius: number) {
  return 2 * Math.PI * radius;
}

export function SubscriptionRingGauge({
  title,
  used,
  total,
  usedLabel,
  remainingLabel,
  centerValue,
  centerSub,
  accentColor = '#16a34a'
}: SubscriptionRingGaugeProps) {
  const safeTotal = Math.max(total, 1);
  const safeUsed = Math.min(Math.max(used, 0), safeTotal);
  const remaining = Math.max(safeTotal - safeUsed, 0);
  const ratio = safeUsed / safeTotal;

  const innerCirc = ringCircumference(INNER_RADIUS);
  const innerDash = innerCirc * ratio;

  return (
    <div className="flex flex-col items-center rounded-2xl border border-gray-100 bg-gray-50/80 p-4">
      <p className="mb-3 text-center text-xs font-bold text-gray-600">{title}</p>

      <div className="relative" style={{ width: SIZE, height: SIZE }}>
        <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="-rotate-90">
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={OUTER_RADIUS}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth={OUTER_STROKE}
          />
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={INNER_RADIUS}
            fill="none"
            stroke={accentColor}
            strokeWidth={INNER_STROKE}
            strokeLinecap="round"
            strokeDasharray={`${innerDash} ${innerCirc - innerDash}`}
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-lg font-black leading-none text-gray-900">{centerValue}</span>
          {centerSub ? <span className="mt-1 text-[10px] font-bold text-gray-500">{centerSub}</span> : null}
        </div>
      </div>

      <div className="mt-3 w-full space-y-1 text-center text-xs">
        <p className="text-gray-600">
          <span className="font-bold text-gray-900">{usedLabel}:</span> {safeUsed}
        </p>
        <p className="text-gray-600">
          <span className="font-bold text-gray-900">{remainingLabel}:</span> {remaining}
        </p>
      </div>
    </div>
  );
}
