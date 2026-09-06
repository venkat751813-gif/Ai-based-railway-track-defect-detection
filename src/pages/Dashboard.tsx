import { useEffect, useState } from 'react';
import { Activity, AlertOctagon, Bell, Gauge, ShieldCheck, TrainTrack, ScanLine, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { apiGet, DEFECT_LABELS, relativeTime, fmtNum } from '../lib/api';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import SeverityBadge from '../components/SeverityBadge';
import HealthBar from '../components/HealthBar';

interface Stats {
  total_sections: number; total_km: number; avg_health: number; open_defects: number;
  critical_defects: number; total_inspections: number; active_alerts: number;
  by_severity: Record<string, number>; by_type: Record<string, number>;
  timeline: { date: string; inspections: number; defects: number }[];
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [tracks, setTracks] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [s, t, a] = await Promise.all([
        apiGet<Stats>('/api/stats'),
        apiGet<any[]>('/api/tracks'),
        apiGet<any[]>('/api/alerts?acknowledged=false&limit=5'),
      ]);
      setStats(s); setTracks(t); setAlerts(a);
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const sortedTracks = [...tracks].sort((a, b) => (a.health_score || 0) - (b.health_score || 0)).slice(0, 6);
  const maxTL = Math.max(1, ...(stats?.timeline || []).map(t => t.inspections));

  return (
    <div>
      <PageHeader kicker="Command Center // Live" title="Track Health Overview">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-ok/40 bg-ok/10">
          <span className="w-2 h-2 rounded-full bg-ok pulse-dot" />
          <span className="font-mono text-xs text-ok uppercase tracking-wider">Realtime Sync</span>
        </div>
      </PageHeader>

      <div className="px-5 lg:px-8 py-6 space-y-6">
        {loading && <div className="font-mono text-ink-mute text-sm">Loading fleet telemetry…</div>}
        {stats && (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label="Fleet Health" value={fmtNum(stats.avg_health, 1)} unit="/100" icon={Gauge} accent={stats.avg_health >= 70 ? 'ok' : 'med'} sub={`${stats.total_sections} sections tracked`} />
              <StatCard label="Track Coverage" value={fmtNum(stats.total_km, 1)} unit="km" icon={TrainTrack} accent="amber" sub="under active monitoring" />
              <StatCard label="Open Defects" value={fmtNum(stats.open_defects)} icon={AlertOctagon} accent={stats.open_defects > 0 ? 'crit' : 'ok'} sub={`${stats.critical_defects} critical`} />
              <StatCard label="Active Alerts" value={fmtNum(stats.active_alerts)} icon={Bell} accent={stats.active_alerts > 0 ? 'high' as any : 'ok'} sub={`${stats.total_inspections} total inspections`} />
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 rounded-md border border-border bg-panel p-5">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <div className="font-mono text-[10px] uppercase tracking-widest text-ink-mute">Inspection Throughput</div>
                    <div className="font-mono font-bold text-lg text-ink mt-1">Last 14 Days</div>
                  </div>
                  <Activity size={14} className="text-amber" />
                </div>
                <div className="flex items-end gap-1 h-40">
                  {stats.timeline.map((t, i) => (
                    <div key={t.date} className="flex-1 flex flex-col items-center gap-1 group">
                      <div className="font-mono text-[10px] text-ink opacity-0 group-hover:opacity-100 transition">
                        {t.inspections}
                      </div>
                      <div className="w-full flex flex-col justify-end h-full">
                        <div
                          className="w-full bg-amber/70 hover:bg-amber transition rounded-t"
                          style={{ height: `${(t.inspections / maxTL) * 100}%`, minHeight: t.inspections > 0 ? '3px' : '1px' }}
                        />
                      </div>
                      {i % 2 === 0 && <div className="font-mono text-[9px] text-ink-mute">{t.date.slice(5)}</div>}
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-md border border-border bg-panel p-5">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <div className="font-mono text-[10px] uppercase tracking-widest text-ink-mute">Defect Severity</div>
                    <div className="font-mono font-bold text-lg text-ink mt-1">Open Distribution</div>
                  </div>
                  <ShieldCheck size={14} className="text-amber" />
                </div>
                <div className="space-y-3">
                  {(['critical', 'high', 'medium', 'low'] as const).map(sev => {
                    const val = stats.by_severity[sev] || 0;
                    const total = Object.values(stats.by_severity).reduce((a, b) => a + b, 0);
                    const pct = total ? (val / total) * 100 : 0;
                    const color = { critical: '#ef4444', high: '#f97316', medium: '#eab308', low: '#38bdf8' }[sev];
                    return (
                      <div key={sev}>
                        <div className="flex items-center justify-between mb-1">
                          <SeverityBadge level={sev} />
                          <span className="font-mono text-sm text-ink">{val}</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-border overflow-hidden">
                          <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              <div className="rounded-md border border-border bg-panel">
                <div className="flex items-center justify-between p-5 border-b border-border">
                  <div>
                    <div className="font-mono text-[10px] uppercase tracking-widest text-ink-mute">Priority Watch</div>
                    <div className="font-mono font-bold text-lg text-ink mt-1">Lowest Health Sections</div>
                  </div>
                  <Link to="/sections" className="font-mono text-xs text-amber hover:text-amber-glow inline-flex items-center gap-1">
                    All sections <ArrowUpRight size={12} />
                  </Link>
                </div>
                <div className="divide-y divide-border">
                  {sortedTracks.map(t => (
                    <div key={t.id} className="p-4 flex items-center justify-between gap-4 hover:bg-panel-2/50 transition">
                      <div className="min-w-0">
                        <div className="font-mono font-semibold text-ink text-sm">{t.section_code}</div>
                        <div className="text-xs text-ink-mute truncate">{t.line_name} · {t.start_km}–{t.end_km} km</div>
                      </div>
                      <div className="w-40 shrink-0"><HealthBar value={t.health_score || 0} /></div>
                      <div className="w-24 shrink-0 text-right"><SeverityBadge level={t.status} /></div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-md border border-border bg-panel">
                <div className="flex items-center justify-between p-5 border-b border-border">
                  <div>
                    <div className="font-mono text-[10px] uppercase tracking-widest text-ink-mute">Critical Feed</div>
                    <div className="font-mono font-bold text-lg text-ink mt-1">Unacknowledged Alerts</div>
                  </div>
                  <Link to="/alerts" className="font-mono text-xs text-amber hover:text-amber-glow inline-flex items-center gap-1">
                    Alert center <ArrowUpRight size={12} />
                  </Link>
                </div>
                <div className="divide-y divide-border max-h-[380px] overflow-auto">
                  {alerts.length === 0 && (
                    <div className="p-8 text-center">
                      <ShieldCheck size={28} className="text-ok mx-auto mb-2" />
                      <div className="font-mono text-sm text-ink">All clear — no active alerts</div>
                    </div>
                  )}
                  {alerts.map(a => (
                    <div key={a.id} className="p-4 flex items-start gap-3">
                      <div className={`w-1 self-stretch rounded-full ${a.severity === 'critical' ? 'bg-crit' : 'bg-high'}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <div className="font-mono text-sm text-ink truncate">{a.title}</div>
                          <SeverityBadge level={a.severity} />
                        </div>
                        <div className="text-xs text-ink-dim mt-1">{a.message}</div>
                        <div className="font-mono text-[10px] text-ink-mute mt-1.5">{relativeTime(a.created_at)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-md border border-border bg-panel p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-widest text-ink-mute">Detection Taxonomy</div>
                  <div className="font-mono font-bold text-lg text-ink mt-1">Open Defects by Class</div>
                </div>
                <Link to="/inspect" className="font-mono text-xs px-3 py-1.5 rounded border border-amber/40 text-amber hover:bg-amber/10 inline-flex items-center gap-1.5">
                  <ScanLine size={12} /> Run new scan
                </Link>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Object.entries(DEFECT_LABELS).map(([k, label]) => {
                  const v = stats.by_type[k] || 0;
                  return (
                    <div key={k} className="p-3 rounded border border-border bg-panel-2">
                      <div className="font-mono text-[10px] text-ink-mute uppercase tracking-wider mb-1">{label}</div>
                      <div className="font-mono text-2xl font-bold text-ink">{v}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
