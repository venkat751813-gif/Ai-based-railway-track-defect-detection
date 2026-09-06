import { useEffect, useState } from 'react';
import { apiGet, DEFECT_LABELS } from '../lib/api';
import PageHeader from '../components/PageHeader';

interface Stats {
  total_sections: number; total_km: number; avg_health: number; open_defects: number;
  critical_defects: number; total_inspections: number; active_alerts: number;
  by_severity: Record<string, number>; by_type: Record<string, number>;
  timeline: { date: string; inspections: number; defects: number }[];
}

export default function Analytics() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [tracks, setTracks] = useState<any[]>([]);

  useEffect(() => {
    apiGet<Stats>('/api/stats').then(setStats);
    apiGet<any[]>('/api/tracks').then(setTracks);
  }, []);

  if (!stats) return <div className="p-8 font-mono text-ink-mute">Loading…</div>;

  const totalByType = Object.entries(stats.by_type).sort((a, b) => b[1] - a[1]);
  const maxType = Math.max(1, ...totalByType.map(([, n]) => n));
  const maxTL = Math.max(1, ...stats.timeline.map(t => Math.max(t.inspections, t.defects)));

  // Health distribution buckets
  const buckets = [
    { label: '90–100', min: 90, max: 100, color: '#22c55e' },
    { label: '75–89', min: 75, max: 89, color: '#84cc16' },
    { label: '50–74', min: 50, max: 74, color: '#eab308' },
    { label: '25–49', min: 25, max: 49, color: '#f97316' },
    { label: '0–24', min: 0, max: 24, color: '#ef4444' },
  ].map(b => ({ ...b, n: tracks.filter(t => t.health_score >= b.min && t.health_score <= b.max).length }));

  return (
    <div>
      <PageHeader kicker="Insights" title="Fleet Analytics" />
      <div className="px-5 lg:px-8 py-6 space-y-6">
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="rounded-md border border-border bg-panel p-5">
            <div className="font-mono text-[10px] uppercase tracking-widest text-ink-mute mb-1">Timeline</div>
            <div className="font-mono font-bold text-lg text-ink mb-5">Inspections vs Defects (14d)</div>
            <div className="flex items-end gap-1 h-56">
              {stats.timeline.map((t, i) => (
                <div key={t.date} className="flex-1 flex flex-col items-center gap-0.5">
                  <div className="w-full flex flex-col justify-end h-full gap-0.5">
                    <div className="w-full bg-amber/70 rounded-t" style={{ height: `${(t.inspections / maxTL) * 100}%`, minHeight: t.inspections > 0 ? '2px' : '0' }} title={`${t.inspections} inspections`} />
                    <div className="w-full bg-crit/70 rounded-t" style={{ height: `${(t.defects / maxTL) * 100}%`, minHeight: t.defects > 0 ? '2px' : '0' }} title={`${t.defects} defects`} />
                  </div>
                  {i % 2 === 0 && <div className="font-mono text-[9px] text-ink-mute">{t.date.slice(5)}</div>}
                </div>
              ))}
            </div>
            <div className="flex items-center gap-4 mt-4 font-mono text-[10px] text-ink-mute uppercase tracking-wider">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 bg-amber" /> Inspections</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 bg-crit" /> Defects Found</span>
            </div>
          </div>

          <div className="rounded-md border border-border bg-panel p-5">
            <div className="font-mono text-[10px] uppercase tracking-widest text-ink-mute mb-1">Health Distribution</div>
            <div className="font-mono font-bold text-lg text-ink mb-5">Sections by Health Band</div>
            <div className="space-y-3">
              {buckets.map(b => {
                const max = Math.max(1, ...buckets.map(x => x.n));
                return (
                  <div key={b.label}>
                    <div className="flex items-center justify-between font-mono text-xs mb-1">
                      <span className="text-ink">{b.label}</span>
                      <span className="text-ink-mute">{b.n} sections</span>
                    </div>
                    <div className="h-3 rounded bg-border overflow-hidden">
                      <div className="h-full rounded" style={{ width: `${(b.n / max) * 100}%`, background: b.color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="rounded-md border border-border bg-panel p-5">
          <div className="font-mono text-[10px] uppercase tracking-widest text-ink-mute mb-1">Defect Taxonomy</div>
          <div className="font-mono font-bold text-lg text-ink mb-5">Open Defects by Class</div>
          <div className="space-y-3">
            {totalByType.map(([type, n]) => (
              <div key={type}>
                <div className="flex items-center justify-between font-mono text-xs mb-1">
                  <span className="text-ink">{DEFECT_LABELS[type] || type}</span>
                  <span className="text-ink-mute">{n}</span>
                </div>
                <div className="h-2 rounded bg-border overflow-hidden">
                  <div className="h-full bg-amber rounded" style={{ width: `${(n / maxType) * 100}%` }} />
                </div>
              </div>
            ))}
            {totalByType.length === 0 && <div className="font-mono text-sm text-ink-mute">No open defects</div>}
          </div>
        </div>

        <div className="grid md:grid-cols-4 gap-4">
          {[
            { label: 'Total Inspections', v: stats.total_inspections },
            { label: 'Total Track (km)', v: stats.total_km.toFixed(1) },
            { label: 'Sections Monitored', v: stats.total_sections },
            { label: 'Avg Fleet Health', v: `${stats.avg_health.toFixed(1)}` },
          ].map(x => (
            <div key={x.label} className="p-5 rounded border border-border bg-panel">
              <div className="font-mono text-[10px] uppercase tracking-widest text-ink-mute mb-2">{x.label}</div>
              <div className="font-mono text-3xl font-bold text-amber">{x.v}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
