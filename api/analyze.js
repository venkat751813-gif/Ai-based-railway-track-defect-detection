import supabase from './db-client.js';

// Deterministic pseudo-random from string seed
function seedFromString(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

const DEFECT_TYPES = [
  { type: 'transverse_crack', label: 'Transverse Crack', weight: 0.22, avgSeverity: 'high' },
  { type: 'longitudinal_crack', label: 'Longitudinal Crack', weight: 0.15, avgSeverity: 'medium' },
  { type: 'spalling', label: 'Rail Head Spalling', weight: 0.18, avgSeverity: 'medium' },
  { type: 'corrugation', label: 'Rail Corrugation', weight: 0.12, avgSeverity: 'low' },
  { type: 'missing_fastener', label: 'Missing Fastener', weight: 0.13, avgSeverity: 'high' },
  { type: 'gauge_widening', label: 'Gauge Widening', weight: 0.08, avgSeverity: 'critical' },
  { type: 'joint_gap', label: 'Excessive Joint Gap', weight: 0.07, avgSeverity: 'medium' },
  { type: 'ballast_deficiency', label: 'Ballast Deficiency', weight: 0.05, avgSeverity: 'low' },
];

function pickSeverity(rng, avg) {
  const r = rng();
  const map = { critical: [0.6, 0.3, 0.1, 0], high: [0.15, 0.55, 0.25, 0.05], medium: [0.05, 0.25, 0.55, 0.15], low: [0.02, 0.13, 0.35, 0.5] };
  const probs = map[avg];
  const levels = ['critical', 'high', 'medium', 'low'];
  let acc = 0;
  for (let i = 0; i < probs.length; i++) { acc += probs[i]; if (r < acc) return levels[i]; }
  return 'medium';
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { section_id, inspector, image_url, seed, notes } = req.body;
    if (!section_id) return res.status(400).json({ error: 'section_id required' });

    // Simulate the CV inference pipeline deterministically from a seed
    const rng = seedFromString(String(seed || image_url || Date.now()));
    const numDefects = Math.floor(rng() * 5); // 0-4 defects

    const detections = [];
    for (let i = 0; i < numDefects; i++) {
      let acc = 0; const r = rng();
      let picked = DEFECT_TYPES[0];
      for (const d of DEFECT_TYPES) { acc += d.weight; if (r < acc) { picked = d; break; } }
      const severity = pickSeverity(rng, picked.avgSeverity);
      const confidence = 0.65 + rng() * 0.34;
      detections.push({
        defect_type: picked.type,
        defect_label: picked.label,
        severity,
        confidence: Number(confidence.toFixed(3)),
        bbox_x: Number((0.05 + rng() * 0.7).toFixed(3)),
        bbox_y: Number((0.05 + rng() * 0.7).toFixed(3)),
        bbox_w: Number((0.08 + rng() * 0.22).toFixed(3)),
        bbox_h: Number((0.08 + rng() * 0.22).toFixed(3)),
        position_m: Math.floor(rng() * 1000),
      });
    }

    const avgConf = detections.length ? detections.reduce((a, b) => a + b.confidence, 0) / detections.length : 0;

    // Save inspection
    const { data: inspection, error: iErr } = await supabase.from('inspections').insert({
      section_id,
      inspector: inspector || 'AI Vision Model v4.2',
      inspection_type: 'ai_visual',
      image_url: image_url || null,
      defects_found: detections.length,
      confidence_avg: Number(avgConf.toFixed(3)),
      notes: notes || null,
    }).select().single();
    if (iErr) throw iErr;

    // Save defects
    let savedDefects = [];
    if (detections.length) {
      const rows = detections.map(d => ({
        inspection_id: inspection.id,
        section_id,
        defect_type: d.defect_type,
        severity: d.severity,
        confidence: d.confidence,
        bbox_x: d.bbox_x, bbox_y: d.bbox_y, bbox_w: d.bbox_w, bbox_h: d.bbox_h,
        position_m: d.position_m,
        status: 'open',
      }));
      const { data: defRows, error: dErr } = await supabase.from('defects').insert(rows).select();
      if (dErr) throw dErr;
      savedDefects = defRows;

      // Create alerts for critical/high defects
      const alertRows = savedDefects.filter(d => d.severity === 'critical' || d.severity === 'high').map(d => ({
        section_id,
        defect_id: d.id,
        title: `${d.severity.toUpperCase()}: ${DEFECT_TYPES.find(t => t.type === d.defect_type)?.label || d.defect_type}`,
        message: `Detected on inspection #${inspection.id} at position ${d.position_m}m with ${(d.confidence * 100).toFixed(1)}% confidence.`,
        severity: d.severity,
        acknowledged: false,
      }));
      if (alertRows.length) await supabase.from('alerts').insert(alertRows);
    }

    // Recompute health score for section
    const { data: allOpen } = await supabase.from('defects').select('severity').eq('section_id', section_id).eq('status', 'open');
    const penaltyMap = { critical: 25, high: 12, medium: 5, low: 2 };
    const penalty = (allOpen || []).reduce((s, d) => s + (penaltyMap[d.severity] || 0), 0);
    const health = Math.max(0, Math.min(100, 100 - penalty));
    const status = health < 40 ? 'restricted' : health < 70 ? 'monitoring' : 'operational';
    await supabase.from('track_sections').update({ health_score: health, last_inspected: new Date().toISOString(), status }).eq('id', section_id);

    return res.status(200).json({
      inspection,
      detections: savedDefects.map((d, i) => ({ ...d, defect_label: detections[i].defect_label })),
      health_score: health,
    });
  } catch (err) {
    console.error('analyze error:', err);
    res.status(500).json({ error: err.message });
  }
}
