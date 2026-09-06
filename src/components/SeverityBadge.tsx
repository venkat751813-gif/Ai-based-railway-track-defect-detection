const styles: Record<string, string> = {
  critical: 'bg-crit/15 text-crit border-crit/40',
  high: 'bg-high/15 text-high border-high/40',
  medium: 'bg-med/15 text-med border-med/40',
  low: 'bg-low/15 text-low border-low/40',
  operational: 'bg-ok/15 text-ok border-ok/40',
  monitoring: 'bg-med/15 text-med border-med/40',
  restricted: 'bg-high/15 text-high border-high/40',
  closed: 'bg-crit/15 text-crit border-crit/40',
  open: 'bg-crit/15 text-crit border-crit/40',
  scheduled: 'bg-low/15 text-low border-low/40',
  resolved: 'bg-ok/15 text-ok border-ok/40',
};

export default function SeverityBadge({ level }: { level: string }) {
  const cls = styles[level] || 'bg-panel-2 text-ink-dim border-border';
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded border font-mono text-[10px] uppercase tracking-wider ${cls}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {level}
    </span>
  );
}
