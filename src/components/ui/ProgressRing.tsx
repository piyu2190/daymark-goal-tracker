interface ProgressRingProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  showLabel?: boolean;
  label?: string;
  sublabel?: string;
}

export function ProgressRing({
  percentage,
  size = 120,
  strokeWidth = 10,
  showLabel = true,
  label,
  sublabel,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(percentage, 100) / 100) * circumference;

  const color = percentage >= 100 ? '#4F8A5B' : percentage >= 50 ? '#6BA877' : percentage > 0 ? '#E8A87C' : '#D6D3D1';

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#F0E9DC"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.5s ease, stroke 0.3s ease' }}
        />
      </svg>
      {showLabel && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-stone-800 font-display" style={{ fontSize: size * 0.22 }}>
            {label ?? `${percentage}%`}
          </span>
          {sublabel && (
            <span className="text-xs text-stone-500 mt-0.5">{sublabel}</span>
          )}
        </div>
      )}
    </div>
  );
}
