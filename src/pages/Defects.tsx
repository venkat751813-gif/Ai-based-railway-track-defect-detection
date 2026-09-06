import { useEffect, useMemo, useState } from 'react';
import { apiGet, apiPatch, DEFECT_LABELS, relativeTime } from '../lib/api';
import PageHeader from '../components/PageHeader';
import SeverityBadge from '../components/SeverityBadge';

export default function Defects() {
  const [defects, setDefects] = useState<any[]>([]);
  const [tracks, setTracks] = useState<any[]>([]);
  const [sev, setSev] = useState<string>('all');
  const [status, setStatus] = useState<string>('all');
  const [busy, setBusy] = useState<number | null>(null);

  const load = async () => {
    const [d, t] = await Promise.all([apiGet<any[]>('/api/defects'), apiGet<any[]>('/api/tracks')]);
    setDefects(d); setTracks(t);
  };
  useEffect(() => { load(); }, []);

  const trackMap = useMemo(() => Object.fromEntries(tracks.map(t => [t.id, t])), [tracks]);

  const rows = defects.filter(d =>
    (sev === 'all' || d.severity === sev) && (status === 'all' || d.status === status)
  );

  const updateStatus = async (id: number, s: string) => {
    setBusy(id);
    await apiPatch('/api/defects', { id, status: s });
    await load(); setBusy(null);
  };

  const counts = ['critical', 'high', 'medium', 'low'].map(s => ({ s, n: defects.filter(d => d.severity === s && d.status === 'open').length }));

  return (
    <div>
      <PageHeader kicker="Defect Registry" title="Defect Log" />
      <div className="px-5 lg:px-8 py-6 space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {counts.map(c => (
            <div key={c.s} className="p-4 rounded border border-border bg-panel">
              <div className="flex items-center justify-between mb-2"><SeverityBadge level={c.s} /><span className="font-mono text-2xl font-bold text-ink">{c.n}</span></div>
              <div className="font-mono text-[10px] text-ink-mute uppercase tracking-wider">open {c.s}</div>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-[10px] uppercase tracking-widest text-ink-mute">Severity:</span>
          {['all', 'critical', 'high', 'medium', 'low'].map(s => (
            <button key={s} onClick={() => setSev(s)}
              className={`px-3 py-1 rounded border font-mono text-xs uppercase tracking-wider ${sev === s ? 'border-amber text-amber bg-amber/10' : 'border-border text-ink-dim hover:border-border-2'}`}>{s}</button>
          ))}
          <div className="w-4" />
          <span className="font-mono text-[10px] uppercase tracking-widest text-ink-mute">Status:</span>
          {['all', 'open', 'scheduled', 'resolved'].map(s => (
            <button key={s} onClick={() => setStatus(s)}
              className={`px-3 py-1 rounded border font-mono text-xs uppercase tracking-wider ${status === s ? 'border-amber text-amber bg-amber/10' : 'border-border text-ink-dim hover:border-border-2'}`}>{s}</button>
          ))}
        </div>

        <div className="rounded-md border border-border bg-panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-panel-2 border-b border-border text-ink-mute">
                <tr>
                  {['ID', 'Section', 'Defect Type', 'Severity', 'Confidence', 'Position', 'Detected', 'Status', ''].map(h => (
                    <th key={h} className="text-left font-mono text-[10px] uppercase tracking-widest px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map(d => {
                  const t = trackMap[d.section_id];
                  return (
                    <tr key={d.id} className="hover:bg-panel-2/60">
                      <td className="px-4 py-3 font-mono text-xs text-ink-mute">#{d.id}</td>
                      <td className="px-4 py-3">
                        <div className="font-mono text-ink">{t?.section_code || '—'}</div>
                        <div className="font-mono text-[10px] text-ink-mute">{t?.line_name}</div>
                      </td>
                      <td className="px-4 py-3 font-mono text-ink">{DEFECT_LABELS[d.defect_type] || d.defect_type}</td>
                      <td className="px-4 py-3"><SeverityBadge level={d.severity} /></td>
                      <td className="px-4 py-3 font-mono text-ink">{(d.confidence * 100).toFixed(1)}%</td>
                      <td className="px-4 py-3 font-mono text-ink-dim">{d.position_m}m</td>
                      <td className="px-4 py-3 font-mono text-xs text-ink-dim">{relativeTime(d.detected_at)}</td>
                      <td className="px-4 py-3"><SeverityBadge level={d.status} /></td>
                      <td className="px-4 py-3">
                        {d.status !== 'resolved' && (
                          <div className="flex gap-1">
                            {d.status === 'open' && (
                              <button disabled={busy === d.id} onClick={() => updateStatus(d.id, 'scheduled')}
                                className="px-2 py-1 rounded border border-border text-[10px] font-mono uppercase tracking-wider text-ink-dim hover:text-low hover:border-low/50 disabled:opacity-50">
                                Schedule
                              </button>
                            )}
                            <button disabled={busy === d.id} onClick={() => updateStatus(d.id, 'resolved')}
                              className="px-2 py-1 rounded border border-border text-[10px] font-mono uppercase tracking-wider text-ink-dim hover:text-ok hover:border-ok/50 disabled:opacity-50">
                              Resolve
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {rows.length === 0 && <tr><td colSpan={9} className="p-8 text-center font-mono text-sm text-ink-mute">No defects match the filters</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
