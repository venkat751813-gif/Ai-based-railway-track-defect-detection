import { useEffect, useMemo, useState } from 'react';
import { MapPin, X, ArrowUpDown } from 'lucide-react';
import { apiGet, relativeTime } from '../lib/api';
import PageHeader from '../components/PageHeader';
import SeverityBadge from '../components/SeverityBadge';
import HealthBar from '../components/HealthBar';

type SortKey = 'section_code' | 'health_score' | 'last_inspected' | 'status';

export default function TrackSections() {
  const [tracks, setTracks] = useState<any[]>([]);
  const [defects, setDefects] = useState<any[]>([]);
  const [inspections, setInspections] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [sort, setSort] = useState<{ key: SortKey; dir: 'asc' | 'desc' }>({ key: 'health_score', dir: 'asc' });
  const [query, setQuery] = useState('');

  useEffect(() => {
    apiGet<any[]>('/api/tracks').then(setTracks);
    apiGet<any[]>('/api/defects').then(setDefects);
    apiGet<any[]>('/api/inspections').then(setInspections);
  }, []);

  const rows = useMemo(() => {
    const q = query.toLowerCase();
    return [...tracks]
      .filter(t => !q || t.section_code.toLowerCase().includes(q) || t.line_name.toLowerCase().includes(q))
      .sort((a, b) => {
        const av = a[sort.key], bv = b[sort.key];
        if (av === bv) return 0;
        const cmp = av > bv ? 1 : -1;
        return sort.dir === 'asc' ? cmp : -cmp;
      });
  }, [tracks, sort, query]);

  const openDefectsFor = (id: number) => defects.filter(d => d.section_id === id && d.status === 'open');

  const toggleSort = (k: SortKey) => setSort(s => ({ key: k, dir: s.key === k && s.dir === 'asc' ? 'desc' : 'asc' }));

  const sectionDefects = selected ? defects.filter(d => d.section_id === selected.id) : [];
  const sectionInspections = selected ? inspections.filter(i => i.section_id === selected.id) : [];

  return (
    <div>
      <PageHeader kicker="Fleet Registry" title="Track Sections">
        <input
          value={query} onChange={e => setQuery(e.target.value)} placeholder="Search sections…"
          className="bg-panel border border-border rounded px-3 py-2 text-sm font-mono text-ink focus:border-amber outline-none w-64"
        />
      </PageHeader>

      <div className="px-5 lg:px-8 py-6">
        <div className="rounded-md border border-border bg-panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-panel-2 border-b border-border text-ink-mute">
                <tr>
                  {[
                    { k: 'section_code' as SortKey, label: 'Section' },
                    { k: 'status' as SortKey, label: 'Status' },
                    { k: 'health_score' as SortKey, label: 'Health' },
                    { k: null, label: 'Open Defects' },
                    { k: null, label: 'Location' },
                    { k: 'last_inspected' as SortKey, label: 'Last Scan' },
                  ].map(col => (
                    <th key={col.label} className="text-left font-mono text-[10px] uppercase tracking-widest px-4 py-3">
                      {col.k ? (
                        <button className="inline-flex items-center gap-1 hover:text-amber" onClick={() => toggleSort(col.k as SortKey)}>
                          {col.label} <ArrowUpDown size={10} />
                        </button>
                      ) : col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map(t => {
                  const open = openDefectsFor(t.id);
                  const crit = open.filter(d => d.severity === 'critical').length;
                  return (
                    <tr key={t.id} onClick={() => setSelected(t)} className="hover:bg-panel-2/60 cursor-pointer transition">
                      <td className="px-4 py-3">
                        <div className="font-mono font-semibold text-ink">{t.section_code}</div>
                        <div className="text-xs text-ink-mute">{t.line_name}</div>
                      </td>
                      <td className="px-4 py-3"><SeverityBadge level={t.status} /></td>
                      <td className="px-4 py-3 w-56"><HealthBar value={t.health_score || 0} /></td>
                      <td className="px-4 py-3">
                        <div className="font-mono text-sm text-ink">{open.length}</div>
                        {crit > 0 && <div className="font-mono text-[10px] text-crit">{crit} critical</div>}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-ink-dim">
                        {Number(t.lat).toFixed(3)}, {Number(t.lng).toFixed(3)}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-ink-dim">{relativeTime(t.last_inspected)}</td>
                    </tr>
                  );
                })}
                {rows.length === 0 && (
                  <tr><td colSpan={6} className="p-8 text-center text-ink-mute font-mono text-sm">No sections match</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setSelected(null)}>
          <div className="bg-panel border border-border rounded-md max-w-3xl w-full max-h-[85vh] overflow-auto fade-in" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-border flex items-start justify-between">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-widest text-amber mb-1">{selected.line_name}</div>
                <div className="font-mono text-2xl font-bold text-ink">{selected.section_code}</div>
                <div className="flex items-center gap-3 mt-2 font-mono text-xs text-ink-dim">
                  <span>{selected.start_km}–{selected.end_km} km</span>
                  <span className="flex items-center gap-1"><MapPin size={11} /> {Number(selected.lat).toFixed(4)}, {Number(selected.lng).toFixed(4)}</span>
                </div>
              </div>
              <button onClick={() => setSelected(null)} className="p-2 hover:bg-panel-2 rounded"><X size={16} /></button>
            </div>
            <div className="p-5 grid md:grid-cols-3 gap-4 border-b border-border">
              <div className="p-4 rounded border border-border bg-panel-2">
                <div className="font-mono text-[10px] uppercase tracking-widest text-ink-mute mb-1">Health</div>
                <div className="font-mono text-2xl font-bold text-amber">{selected.health_score}/100</div>
              </div>
              <div className="p-4 rounded border border-border bg-panel-2">
                <div className="font-mono text-[10px] uppercase tracking-widest text-ink-mute mb-1">Status</div>
                <SeverityBadge level={selected.status} />
              </div>
              <div className="p-4 rounded border border-border bg-panel-2">
                <div className="font-mono text-[10px] uppercase tracking-widest text-ink-mute mb-1">Open Defects</div>
                <div className="font-mono text-2xl font-bold text-ink">{sectionDefects.filter(d => d.status === 'open').length}</div>
              </div>
            </div>
            <div className="p-5">
              <div className="font-mono text-[10px] uppercase tracking-widest text-ink-mute mb-3">Recent Inspections</div>
              <div className="space-y-2 mb-6">
                {sectionInspections.slice(0, 5).map(i => (
                  <div key={i.id} className="flex items-center justify-between p-3 rounded border border-border bg-panel-2 text-sm">
                    <div>
                      <div className="font-mono text-ink">#{i.id} — {i.inspection_type}</div>
                      <div className="font-mono text-[11px] text-ink-mute">{i.inspector} · {relativeTime(i.created_at)}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-sm text-ink">{i.defects_found} defects</div>
                      {i.confidence_avg > 0 && <div className="font-mono text-[10px] text-ink-mute">{(i.confidence_avg * 100).toFixed(0)}% avg conf</div>}
                    </div>
                  </div>
                ))}
                {sectionInspections.length === 0 && <div className="font-mono text-xs text-ink-mute">No inspections yet</div>}
              </div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-ink-mute mb-3">Active Defects</div>
              <div className="space-y-2">
                {sectionDefects.filter(d => d.status === 'open').map(d => (
                  <div key={d.id} className="flex items-center justify-between p-3 rounded border border-border bg-panel-2 text-sm">
                    <div>
                      <div className="font-mono text-ink">{d.defect_type.replace(/_/g, ' ')}</div>
                      <div className="font-mono text-[11px] text-ink-mute">pos {d.position_m}m · {(d.confidence * 100).toFixed(0)}% conf</div>
                    </div>
                    <SeverityBadge level={d.severity} />
                  </div>
                ))}
                {sectionDefects.filter(d => d.status === 'open').length === 0 && <div className="font-mono text-xs text-ok">✓ No active defects</div>}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
