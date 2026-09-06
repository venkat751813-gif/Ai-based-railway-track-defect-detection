import supabase from './db-client.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    const [{ data: tracks }, { data: defects }, { data: inspections }, { data: alerts }] = await Promise.all([
      supabase.from('track_sections').select('*'),
      supabase.from('defects').select('*'),
      supabase.from('inspections').select('*'),
      supabase.from('alerts').select('*').eq('acknowledged', false),
    ]);

    const totalTrackKm = (tracks || []).reduce((s, t) => s + (Number(t.end_km) - Number(t.start_km)), 0);
    const avgHealth = tracks && tracks.length ? tracks.reduce((s, t) => s + (t.health_score || 0), 0) / tracks.length : 0;
    const openDefects = (defects || []).filter(d => d.status === 'open');

    const bySeverity = { critical: 0, high: 0, medium: 0, low: 0 };
    openDefects.forEach(d => { bySeverity[d.severity] = (bySeverity[d.severity] || 0) + 1; });

    const byType = {};
    openDefects.forEach(d => { byType[d.defect_type] = (byType[d.defect_type] || 0) + 1; });

    // Last 14 days inspection counts
    const now = new Date();
    const days = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now); d.setDate(d.getDate() - i); d.setHours(0, 0, 0, 0);
      days.push({ date: d.toISOString().slice(0, 10), inspections: 0, defects: 0 });
    }
    (inspections || []).forEach(ins => {
      const dt = new Date(ins.created_at).toISOString().slice(0, 10);
      const bucket = days.find(x => x.date === dt);
      if (bucket) { bucket.inspections += 1; bucket.defects += ins.defects_found || 0; }
    });

    return res.status(200).json({
      total_sections: tracks?.length || 0,
      total_km: Number(totalTrackKm.toFixed(1)),
      avg_health: Number(avgHealth.toFixed(1)),
      open_defects: openDefects.length,
      critical_defects: bySeverity.critical || 0,
      total_inspections: inspections?.length || 0,
      active_alerts: alerts?.length || 0,
      by_severity: bySeverity,
      by_type: byType,
      timeline: days,
    });
  } catch (err) {
    console.error('stats error:', err);
    res.status(500).json({ error: err.message });
  }
}
