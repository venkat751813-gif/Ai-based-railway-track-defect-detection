export default function HealthBar({ value }: { value: number }) {
  const color = value >= 75 ? '#22c55e' : value >= 50 ? '#eab308' : value >= 25 ? '#f97316' : '#ef4444';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-border overflow-hidden min-w-[60px]">
        <div className="h-full rounded-full transition-all" style={{ width: `${value}%`, background: color }} />
      </div>
      <div className="font-mono text-xs text-ink w-9 text-right">{value}</div>
    </div>
  );
}
