import { useEffect, useState } from 'react';
import { CheckCircle2, Bell, Filter } from 'lucide-react';
import { apiGet, apiPatch, relativeTime } from '../lib/api';
import PageHeader from '../components/PageHeader';
import SeverityBadge from '../components/SeverityBadge';

export default function Alerts() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [tracks, setTracks] = useState<any[]>([]);
  const [filter, setFilter] = useState<'all' | 'active' | 'ack'>('active');
  const [busy, setBusy] = useState<number | null>(null);

  const load = async () => {
    const [a, t] = await Promise.all([apiGet<any[]>('/api/alerts'), apiGet<any[]>('/api/tracks')]);
    setAlerts(a); setTracks(t);
  };
  useEffect(() => { load(); }, []);

  const trackMap = Object.fromEntries(tracks.map(t => [t.id, t]));
  const rows = alerts.filter(a =>
    filter === 'all' ? true : filter === 'active' ? !a.acknowledged : a.acknowledged
  );

  const acknowledge = async (id: number) => {
    setBusy(id);
    await apiPatch('/api/alerts', { id, acknowledged: true });
    await load(); setBusy(null);
  };

  const active = alerts.filter(a => !a.acknowledged).length;
  const crit = alerts.filter(a => !a.acknowledged && a.severity === 'critical').length;

  return (
    <div>
      <PageHeader kicker="Alert Center // Real-Time" title="Incident Alerts">
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-ink-mute" />
          {(['active', 'ack', 'all'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded border font-mono text-xs uppercase tracking-wider ${filter === f ? 'border-amber text-amber bg-amber/10' : 'border-border text-ink-dim'}`}>
              {f === 'ack' ? 'acknowledged' : f}
            </button>
          ))}
        </div>
      </PageHeader>

      <div className="px-5 lg:px-8 py-6 space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div className="p-4 rounded border border-border bg-panel">
            <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-ink-mute mb-1"><Bell size={12} /> Active</div>
            <div className="font-mono text-3xl font-bold text-amber">{active}</div>
          </div>
          <div className="p-4 rounded border border-border bg-panel">
            <div className="font-mono text-[10px] uppercase tracking-widest text-ink-mute mb-1">Critical Now</div>
            <div className="font-mono text-3xl font-bold text-crit">{crit}</div>
          </div>
          <div className="p-4 rounded border border-border bg-panel">
            <div className="font-mono text-[10px] uppercase tracking-widest text-ink-mute mb-1">Total Logged</div>
            <div className="font-mono text-3xl font-bold text-ink">{alerts.length}</div>
          </div>
        </div>

        <div className="space-y-2">
          {rows.map(a => {
            const t = trackMap[a.section_id];
            return (
              <div key={a.id} className={`rounded border bg-panel p-4 flex gap-4 ${a.acknowledged ? 'border-border opacity-70' : 'border-border-2'}`}>
                <div className={`w-1 self-stretch rounded ${a.severity === 'critical' ? 'bg-crit' : a.severity === 'high' ? 'bg-high' : 'bg-med'}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-3 mb-1">
                    <div className="font-mono font-semibold text-ink">{a.title}</div>
                    <SeverityBadge level={a.severity} />
                    {a.acknowledged && <span className="font-mono text-[10px] text-ok uppercase tracking-wider">✓ acknowledged</span>}
                  </div>
                  <div className="text-sm text-ink-dim">{a.message}</div>
                  <div className="flex items-center gap-3 mt-2 font-mono text-[11px] text-ink-mute">
                    <span>{t?.section_code || 'unknown'} · {t?.line_name || ''}</span>
                    <span>·</span>
                    <span>{relativeTime(a.created_at)}</span>
                  </div>
                </div>
                {!a.acknowledged && (
                  <button disabled={busy === a.id} onClick={() => acknowledge(a.id)}
                    className="self-start flex items-center gap-1.5 px-3 py-1.5 rounded border border-ok/40 text-ok font-mono text-xs uppercase tracking-wider hover:bg-ok/10 disabled:opacity-50">
                    <CheckCircle2 size={12} /> Acknowledge
                  </button>
                )}
              </div>
            );
          })}
          {rows.length === 0 && (
            <div className="p-12 rounded border border-border bg-panel text-center">
              <CheckCircle2 size={32} className="text-ok mx-auto mb-3" />
              <div className="font-mono text-ink">Nothing to show</div>
              <div className="text-sm text-ink-mute mt-1">No alerts matching the current filter</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
