import { useEffect, useState } from 'react';
import { Upload, ScanLine, Loader2, CheckCircle2, XCircle, Play } from 'lucide-react';
import { apiGet, apiPost, DEFECT_LABELS } from '../lib/api';
import PageHeader from '../components/PageHeader';
import SeverityBadge from '../components/SeverityBadge';

interface Detection {
  id: number; defect_type: string; defect_label: string; severity: string;
  confidence: number; bbox_x: number; bbox_y: number; bbox_w: number; bbox_h: number; position_m: number;
}

const SAMPLE_IMAGES = [
  { name: 'Section A-142 close-up', url: 'https://images.pexels.com/photos/258510/pexels-photo-258510.jpeg?auto=compress&cs=tinysrgb&w=800', seed: 'crit-a-142' },
  { name: 'Section B-089 fastener view', url: 'https://images.pexels.com/photos/1010657/pexels-photo-1010657.jpeg?auto=compress&cs=tinysrgb&w=800', seed: 'high-b-089' },
  { name: 'Section C-201 joint scan', url: 'https://images.pexels.com/photos/6544380/pexels-photo-6544380.jpeg?auto=compress&cs=tinysrgb&w=800', seed: 'medium-c-201' },
];

export default function Inspection() {
  const [tracks, setTracks] = useState<any[]>([]);
  const [sectionId, setSectionId] = useState<number | null>(null);
  const [inspector, setInspector] = useState('AI Vision Model v4.2');
  const [notes, setNotes] = useState('');
  const [imageUrl, setImageUrl] = useState<string>(SAMPLE_IMAGES[0].url);
  const [seed, setSeed] = useState<string>(SAMPLE_IMAGES[0].seed);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [phase, setPhase] = useState<'idle' | 'scanning' | 'classify' | 'done'>('idle');
  const [result, setResult] = useState<{ inspection: any; detections: Detection[]; health_score: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiGet<any[]>('/api/tracks').then(t => { setTracks(t); if (t.length) setSectionId(t[0].id); });
  }, []);

  const pickSample = (s: typeof SAMPLE_IMAGES[0]) => {
    setImageUrl(s.url); setSeed(s.seed); setResult(null); setPhase('idle');
  };

  const handleUpload = async (file: File) => {
    setUploading(true); setError(null);
    try {
      const b64 = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve((r.result as string).split(',')[1]);
        r.onerror = reject;
        r.readAsDataURL(file);
      });
      const res = await apiPost<{ url: string }>('/api/upload', {
        fileName: file.name, fileBase64: b64, contentType: file.type,
      });
      setImageUrl(res.url); setSeed(file.name + file.size); setResult(null); setPhase('idle');
    } catch (e: any) {
      setError(e.message || 'Upload failed');
    } finally { setUploading(false); }
  };

  const runAnalysis = async () => {
    if (!sectionId) return;
    setAnalyzing(true); setError(null); setResult(null);
    setPhase('scanning');
    await new Promise(r => setTimeout(r, 900));
    setPhase('classify');
    await new Promise(r => setTimeout(r, 700));
    try {
      const res = await apiPost<any>('/api/analyze', {
        section_id: sectionId, inspector, image_url: imageUrl, seed, notes: notes || null,
      });
      setResult(res); setPhase('done');
    } catch (e: any) {
      setError(e.message || 'Analysis failed'); setPhase('idle');
    } finally { setAnalyzing(false); }
  };

  const bboxColor = (sev: string) => ({ critical: '#ef4444', high: '#f97316', medium: '#eab308', low: '#38bdf8' } as any)[sev] || '#f59e0b';

  return (
    <div>
      <PageHeader kicker="Neural Pipeline // RT-Vision v4.2" title="AI Defect Inspection">
        <div className="font-mono text-xs text-ink-mute">YOLO-v8 · ResNet-50 · 42ms inference</div>
      </PageHeader>

      <div className="px-5 lg:px-8 py-6 grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 space-y-4">
          <div className="relative aspect-video rounded-md border border-border bg-panel overflow-hidden grid-bg">
            {imageUrl ? (
              <>
                <img src={imageUrl} alt="rail" className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/25" />
                {/* Scan effect */}
                {phase === 'scanning' && (
                  <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="scan-line absolute inset-x-0 top-0 h-1 bg-gradient-to-b from-amber to-transparent blur-sm" />
                    <div className="absolute inset-0 border-2 border-amber/40" />
                  </div>
                )}
                {/* Bounding boxes */}
                {result?.detections.map((d, i) => (
                  <div key={d.id} className="absolute pointer-events-none fade-in" style={{
                    left: `${d.bbox_x * 100}%`, top: `${d.bbox_y * 100}%`,
                    width: `${d.bbox_w * 100}%`, height: `${d.bbox_h * 100}%`,
                    animationDelay: `${i * 90}ms`,
                  }}>
                    <svg className="absolute inset-0 w-full h-full overflow-visible">
                      <rect x="0" y="0" width="100%" height="100%" fill="none" stroke={bboxColor(d.severity)} strokeWidth="2" className="ants" />
                    </svg>
                    <div className="absolute -top-6 left-0 px-1.5 py-0.5 rounded font-mono text-[10px] whitespace-nowrap uppercase tracking-wider" style={{ background: bboxColor(d.severity), color: '#0a0c0f' }}>
                      {d.defect_label} · {(d.confidence * 100).toFixed(0)}%
                    </div>
                  </div>
                ))}

                <div className="absolute top-3 left-3 flex items-center gap-2">
                  <div className="px-2 py-1 rounded bg-black/60 border border-amber/40 font-mono text-[10px] text-amber uppercase tracking-widest flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber pulse-dot" /> LIVE FEED
                  </div>
                  <div className="px-2 py-1 rounded bg-black/60 border border-border font-mono text-[10px] text-ink-dim uppercase tracking-widest">
                    RGB 1920×1080 · 30fps
                  </div>
                </div>

                {(phase === 'scanning' || phase === 'classify') && (
                  <div className="absolute bottom-3 left-3 right-3 flex items-center gap-2">
                    <Loader2 size={14} className="text-amber animate-spin" />
                    <div className="font-mono text-xs text-amber">
                      {phase === 'scanning' ? 'SCANNING RAIL SURFACE…' : 'CLASSIFYING ANOMALIES…'}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-ink-mute font-mono text-sm">No image loaded</div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3">
            {SAMPLE_IMAGES.map(s => (
              <button key={s.url} onClick={() => pickSample(s)} className={`rounded border overflow-hidden text-left transition ${
                imageUrl === s.url ? 'border-amber' : 'border-border hover:border-border-2'
              }`}>
                <div className="aspect-video bg-panel-2 overflow-hidden">
                  <img src={s.url} className="w-full h-full object-cover" alt="" />
                </div>
                <div className="p-2 font-mono text-[10px] text-ink-dim uppercase tracking-wider">{s.name}</div>
              </button>
            ))}
          </div>

          <label className="flex items-center gap-3 p-4 rounded-md border border-dashed border-border-2 bg-panel/50 cursor-pointer hover:border-amber/50 transition">
            <Upload size={18} className="text-amber" />
            <div className="flex-1">
              <div className="font-mono text-sm text-ink">Upload custom rail image</div>
              <div className="font-mono text-[11px] text-ink-mute">JPEG/PNG · max 10MB · saved to secure blob storage</div>
            </div>
            {uploading && <Loader2 size={16} className="animate-spin text-amber" />}
            <input type="file" accept="image/*" className="hidden" disabled={uploading}
              onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(f); }} />
          </label>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-md border border-border bg-panel p-5 space-y-4">
            <div className="font-mono text-[10px] uppercase tracking-widest text-ink-mute">Inspection Configuration</div>

            <div>
              <label className="block font-mono text-[11px] text-ink-dim mb-1.5">Target section</label>
              <select value={sectionId ?? ''} onChange={e => setSectionId(Number(e.target.value))}
                className="w-full bg-panel-2 border border-border rounded px-3 py-2 text-sm font-mono text-ink focus:border-amber outline-none">
                {tracks.map(t => <option key={t.id} value={t.id}>{t.section_code} — {t.line_name}</option>)}
              </select>
            </div>

            <div>
              <label className="block font-mono text-[11px] text-ink-dim mb-1.5">Inspector / Model</label>
              <input value={inspector} onChange={e => setInspector(e.target.value)}
                className="w-full bg-panel-2 border border-border rounded px-3 py-2 text-sm font-mono text-ink focus:border-amber outline-none" />
            </div>

            <div>
              <label className="block font-mono text-[11px] text-ink-dim mb-1.5">Notes (optional)</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
                placeholder="Weather conditions, equipment used…"
                className="w-full bg-panel-2 border border-border rounded px-3 py-2 text-sm font-mono text-ink focus:border-amber outline-none resize-none" />
            </div>

            <button onClick={runAnalysis} disabled={analyzing || !sectionId || !imageUrl}
              className="w-full flex items-center justify-center gap-2 bg-amber text-bg font-mono font-bold text-sm py-3 rounded hover:bg-amber-glow disabled:opacity-50 disabled:cursor-not-allowed transition">
              {analyzing ? <><Loader2 size={16} className="animate-spin" /> ANALYZING…</> : <><Play size={14} /> RUN AI INSPECTION</>}
            </button>
            {error && <div className="font-mono text-xs text-crit flex items-center gap-1.5"><XCircle size={12} /> {error}</div>}
          </div>

          <div className="rounded-md border border-border bg-panel p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-widest text-ink-mute">Detection Results</div>
                <div className="font-mono font-bold text-lg text-ink mt-0.5">
                  {result ? `${result.detections.length} defect${result.detections.length === 1 ? '' : 's'} found` : 'Awaiting scan'}
                </div>
              </div>
              <ScanLine size={16} className="text-amber" />
            </div>

            {result && result.detections.length === 0 && (
              <div className="flex items-center gap-3 p-3 rounded bg-ok/10 border border-ok/30">
                <CheckCircle2 size={18} className="text-ok" />
                <div>
                  <div className="font-mono text-sm text-ok">Rail section clean</div>
                  <div className="text-xs text-ink-dim">No anomalies above 0.65 confidence threshold</div>
                </div>
              </div>
            )}

            {result && result.detections.length > 0 && (
              <div className="space-y-2">
                {result.detections.map((d, i) => (
                  <div key={d.id} className="p-3 rounded border border-border bg-panel-2 fade-in" style={{ animationDelay: `${i * 60}ms` }}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="font-mono text-sm text-ink">{DEFECT_LABELS[d.defect_type] || d.defect_type}</div>
                      <SeverityBadge level={d.severity} />
                    </div>
                    <div className="flex items-center justify-between font-mono text-[11px] text-ink-mute">
                      <span>pos: {d.position_m}m</span>
                      <span>conf: {(d.confidence * 100).toFixed(1)}%</span>
                    </div>
                    <div className="mt-1.5 h-1 rounded bg-border overflow-hidden">
                      <div className="h-full bg-amber" style={{ width: `${d.confidence * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {result && (
              <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                <div className="font-mono text-[10px] uppercase tracking-widest text-ink-mute">Section health</div>
                <div className="font-mono text-lg font-bold text-amber">{result.health_score}/100</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
