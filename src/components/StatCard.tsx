import { LucideIcon } from 'lucide-react';

export default function StatCard({ label, value, unit, icon: Icon, accent, sub }: {
  label: string; value: string | number; unit?: string; icon?: LucideIcon; accent?: 'amber' | 'ok' | 'crit' | 'low' | 'med'; sub?: string;
}) {
  const accentClass = {
    amber: 'text-amber', ok: 'text-ok', crit: 'text-crit', low: 'text-low', med: 'text-med',
  }[accent || 'amber'];
  return (
    <div className="relative overflow-hidden rounded-md border border-border bg-panel p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="font-mono text-[10px] uppercase tracking-widest text-ink-mute">{label}</div>
        {Icon && <Icon size={14} className={accentClass} />}
      </div>
      <div className="flex items-baseline gap-1.5">
        <div className={`font-mono font-bold text-3xl leading-none ${accentClass}`}>{value}</div>
        {unit && <div className="font-mono text-xs text-ink-mute">{unit}</div>}
      </div>
      {sub && <div className="mt-3 font-mono text-[11px] text-ink-mute">{sub}</div>}
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-amber/40 to-transparent opacity-60" />
    </div>
  );
}
